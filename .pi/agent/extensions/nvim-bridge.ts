/**
 * nvim-bridge: let Neovim send visual selections into a running pi session.
 *
 * On session start (interactive TUI or RPC mode only) this extension listens on
 * a Unix domain socket named after the project directory:
 *
 *   $XDG_RUNTIME_DIR/pi-bridge/nvim-<sha256(realpath(cwd))[:16]>.sock
 *   (fallback: /tmp/pi-bridge-<uid>/...)
 *
 * Neovim (lua/buba/pi.lua) connects and writes a single-line JSON payload:
 *
 *   { "action": "explain" | "refactor" | "tests" | "custom" | "draft",
 *     "instruction": "...", "file": "/abs/path.ts", "start": 42, "end": 58,
 *     "lang": "typescript", "code": "...", "note": "...", "projectRoot": "/..." }
 *
 * The extension formats a prompt (code block + file:lines reference) and either
 * sends it as a user message (queued as follow-up while the agent is busy) or,
 * for "draft", places it in the TUI editor without sending so you can finish
 * the prompt yourself. A one-line JSON ack is written back to nvim.
 *
 * Lifecycle: the server is created in the `session_start` handler and torn down
 * in `session_shutdown` (fires on quit, /new, /resume, /fork, reload). Stale
 * sockets left behind by a hard kill are detected and replaced on next start.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as os from "node:os";
import * as path from "node:path";

interface NvimPayload {
	action: "explain" | "refactor" | "tests" | "custom" | "draft";
	instruction?: string;
	file?: string;
	start?: number;
	end?: number;
	lang?: string;
	code?: string;
	note?: string;
	projectRoot?: string;
}

const MAX_CODE_LINES = 400;
const MAX_CODE_BYTES = 40_000;
const MAX_PAYLOAD_BYTES = 256 * 1024;

// Bridge state for the current session runtime.
let server: net.Server | null = null;
let socketPath: string | null = null;
const connections = new Set<net.Socket>();

function realDir(dir: string): string {
	try {
		return fs.realpathSync(dir);
	} catch {
		return path.resolve(dir);
	}
}

function bridgeDir(): string {
	const xdg = process.env.XDG_RUNTIME_DIR;
	const dir = xdg ? path.join(xdg, "pi-bridge") : path.join(os.tmpdir(), `pi-bridge-${process.getuid?.() ?? 0}`);
	return dir;
}

function socketPathFor(cwd: string): string {
	const hash = crypto.createHash("sha256").update(realDir(cwd)).digest("hex").slice(0, 16);
	return path.join(bridgeDir(), `nvim-${hash}.sock`);
}

function fenceFor(code: string): string {
	let longest = 0;
	for (const run of code.matchAll(/`+/g)) {
		longest = Math.max(longest, run[0].length);
	}
	return "`".repeat(Math.max(3, longest + 1));
}

function truncate(code: string, notes: string[]): string {
	let out = code;
	const lines = out.split("\n");
	if (lines.length > MAX_CODE_LINES) {
		out = lines.slice(0, MAX_CODE_LINES).join("\n");
		notes.push(`selection truncated to the first ${MAX_CODE_LINES} lines`);
	}
	if (Buffer.byteLength(out) > MAX_CODE_BYTES) {
		out = Buffer.from(out.subarray(0, MAX_CODE_BYTES)).toString("utf8");
		notes.push("selection truncated to 40 KB");
	}
	return out;
}

function formatMessage(payload: NvimPayload, cwd: string): string {
	const parts: string[] = [];
	const notes: string[] = [];

	const hasCode = typeof payload.code === "string" && payload.code.length > 0;
	const rel = payload.file ? path.relative(cwd, payload.file) || payload.file : undefined;
	const loc = rel ? `${rel}${payload.start ? ` lines ${payload.start}-${payload.end ?? payload.start}` : ""}` : undefined;

	if (hasCode && payload.code) {
		const code = truncate(payload.code, notes);
		const fence = fenceFor(code);
		if (loc) {
			parts.push(`Code from \`${loc}\`:\n`);
		}
		parts.push(`${fence}${payload.lang || ""}\n${code}\n${fence}\n`);
	} else if (loc) {
		parts.push(`Look at \`${loc}\`.\n`);
	}

	switch (payload.action) {
		case "explain":
			parts.push("Explain what this code does, step by step.");
			break;
		case "refactor":
			parts.push(
				`Refactor this section. Read \`${rel}\` for full context, then apply the refactor directly to the file.`,
			);
			break;
		case "tests":
			parts.push(
				`Write tests for this code. Read \`${rel}\` for context and follow the project's existing test conventions.`,
			);
			break;
		case "draft":
			// No default instruction: the text is a draft for the user to finish.
			if (!payload.instruction && !hasCode && loc) {
				parts.push("(Add your question or instruction, then submit.)");
			}
			break;
		case "custom":
			parts.push(payload.instruction?.trim() || "Look at this code and tell me what you notice.");
			break;
	}

	if (payload.instruction && payload.action !== "custom") {
		parts.push(payload.instruction.trim());
	}
	if (payload.note) {
		notes.push(payload.note);
	}
	if (notes.length > 0) {
		parts.push(`(Note: ${notes.join("; ")})`);
	}
	return parts.join("\n");
}

function teardown(): void {
	for (const conn of connections) {
		conn.destroy();
	}
	connections.clear();
	if (server) {
		try {
			server.close();
		} catch {
			// already closed
		}
		server = null;
	}
	if (socketPath) {
		try {
			fs.unlinkSync(socketPath);
		} catch {
			// gone already
		}
		socketPath = null;
	}
}

function isSocketAlive(target: string, timeoutMs = 300): Promise<boolean> {
	return new Promise((resolve) => {
		const probe = net.connect(target);
		const done = (alive: boolean) => {
			probe.destroy();
			resolve(alive);
		};
		probe.once("connect", () => done(true));
		probe.once("error", () => done(false));
		const timer = setTimeout(() => done(false), timeoutMs);
		timer.unref();
	});
}

async function startServer(
	ctx: ExtensionContext,
	notify: (msg: string, type?: "info" | "warning" | "error") => void,
	sendUserMessage: ExtensionAPI["sendUserMessage"],
): Promise<void> {
	fs.mkdirSync(bridgeDir(), { recursive: true, mode: 0o700 });
	const target = socketPathFor(ctx.cwd);

	if (fs.existsSync(target)) {
		if (await isSocketAlive(target)) {
			notify("nvim-bridge: another live session owns the bridge socket for this directory; taking it over.", "warning");
		}
		// Dead socket left behind by a killed process: safe to replace.
		try {
			fs.unlinkSync(target);
		} catch {
			// gone already
		}
	}

	const current = net.createServer((conn) => {
		connections.add(conn);
		conn.on("close", () => connections.delete(conn));
		let buffer = "";
		conn.on("data", (chunk: Buffer) => {
			buffer += chunk.toString("utf8");
			if (buffer.length > MAX_PAYLOAD_BYTES) {
				conn.write(`${JSON.stringify({ ok: false, error: "payload too large" })}\n`);
				conn.end();
				return;
			}
			const newline = buffer.indexOf("\n");
			if (newline === -1) {
				return;
			}
			const line = buffer.slice(0, newline);
			let ack: Record<string, unknown>;
			try {
				const payload = JSON.parse(line) as NvimPayload;
				const text = formatMessage(payload, ctx.cwd);
				if (payload.action === "draft") {
					if (ctx.mode === "tui") {
						ctx.ui.setEditorText(text);
						ctx.ui.notify("nvim: selection placed in the editor (not sent)", "info");
						ack = { ok: true, delivered: "editor" };
					} else {
						ack = { ok: false, error: "draft requires the interactive TUI" };
					}
				} else {
					const idle = ctx.isIdle();
					sendUserMessage(text, idle ? undefined : { deliverAs: "followUp" });
					ctx.ui.notify(`nvim: ${payload.action} request received${idle ? "" : " (queued as follow-up)"}`, "info");
					ack = { ok: true, delivered: "sent", queued: !idle };
				}
			} catch (error) {
				ack = { ok: false, error: error instanceof Error ? error.message : String(error) };
			}
			conn.write(`${JSON.stringify(ack)}\n`);
			conn.end();
		});
		conn.on("error", () => {
			// Client hung up; nothing to do.
		});
	});

	current.on("error", (error) => {
		notify(`nvim-bridge: socket error: ${error.message}`, "error");
		teardown();
	});

	server = current;
	socketPath = target;
	current.listen(target, () => {
		// Socket ready. chmod for safety on filesystems that ignore mkdir mode.
		try {
			fs.chmodSync(target, 0o600);
		} catch {
			// best effort
		}
	});
}

export default function nvimBridge(pi: ExtensionAPI): void {
	pi.on("session_start", (event, ctx) => {
		teardown(); // idempotent: handles /new, /resume, /fork, reload
		// Only long-lived modes host the socket; print/json runs would briefly
		// steal the well-known path from a live TUI session.
		if (ctx.mode !== "tui" && ctx.mode !== "rpc") {
			return;
		}
		startServer(ctx, (message, type) => ctx.ui.notify(message, type), pi.sendUserMessage).catch((error) => {
			ctx.ui.notify(`nvim-bridge: failed to start: ${error instanceof Error ? error.message : String(error)}`, "error");
		});
		void event;
	});

	pi.on("session_shutdown", () => {
		teardown();
	});

	pi.registerCommand("nvim-ping", {
		description: "Show nvim-bridge socket status",
		handler: async (_args, ctx) => {
			const listening = server !== null && socketPath !== null;
			ctx.ui.notify(
				listening
					? `nvim-bridge listening on ${socketPath} (cwd: ${ctx.cwd}, mode: ${ctx.mode})`
					: `nvim-bridge not listening (mode: ${ctx.mode}; sockets only start in tui/rpc mode)`,
				listening ? "info" : "warning",
			);
		},
	});
}
