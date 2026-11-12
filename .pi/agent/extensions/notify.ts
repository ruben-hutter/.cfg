/**
 * Desktop notification extension for Pi (Linux, notify-send).
 *
 * Missing-binary safety: notify-send is probed once (cached) and skipped
 * silently on hosts without it (headless servers); code-remote's bootstrap
 * installs an ~/.local/bin/notify-send shim there that forwards to the
 * terminal via OSC 9/777. Every fire-and-forget spawn also gets an 'error'
 * handler — spawn(2) failures (ENOENT et al) arrive asynchronously and are
 * NOT caught by try/catch; an unhandled 'error' event crashes pi entirely.
 *
 * Notifies ONLY when:
 *   1. Pi waits on a blocking UI prompt (question/confirmation via ask_user etc.)
 *   2. The session is truly idle: agent settled, nothing queued, nothing running
 *      (verified twice with a short debounce so follow-ups don't cause
 *      premature "finished" notifications)
 *
 * Only the interactive session notifies. Child pi processes (subagents,
 * skills spawning `pi --print`, scripts) inherit the user extensions but
 * have no UI; they are silenced via ctx.hasUI.
 *
 * Every notification is prefixed with a label so you know which session to
 * look at, resolved in this order at notification time:
 *   1. Session display name (set with pi's built-in `/name` command,
 *      tracked live via session_info_changed)
 *   2. tmux session/window name (when running inside tmux)
 *   3. Basename of the working directory
 *
 * Each notification also plays a short sound via pw-play/paplay (works
 * regardless of the notification daemon's sound-hint support). Clips are
 * from the LGTM soundboard (https://lgtm.sjg.io/, cut from the song
 * "LGTM (Looks Good to Me)" by Degenerative Pixels), scraped once into
 * ~/.local/share/sounds/pi/:
 *   - input needed  -> hey-team.mp3      (fallback: message-new-instant.oga)
 *   - finished      -> bot-says-done.mp3 (fallback: complete.oga)
 *
 * ATTENTION QUEUE (see ~/scripts/pi_attention_queue.sh): every notify event also maintains a
 * spool entry in ~/.local/state/pi/attention/<session-id>.json so sessions
 * waiting for the user can be picked oldest-first with `tq` (alt+q popup).
 * Lifecycle: ui_prompt_start -> entry kind=input; agent_settled -> kind=
 * finished; agent_start -> entry deleted (work resumed). tmux hooks + read-time
 * liveness pruning (in tq/pi_attention_hook.sh) own deletion on death/visit;
 * notify.ts only ever creates/updates/removes ITS OWN entry, so concurrent
 * pi sessions never contend. Non-tmux sessions never enqueue.
 */

import { spawn } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Urgency = "low" | "normal" | "critical";

const SETTLE_DEBOUNCE_MS = 2000;
const LGTM_SOUND_DIR = `${homedir()}/.local/share/sounds/pi`;
const FALLBACK_SOUND_DIR = "/usr/share/sounds/freedesktop/stereo";

/**
 * Attention-queue spool (see ~/scripts/pi_attention_queue.sh): one JSON file per pi session that is
 * alive, in tmux, and waiting for the user. notify.ts is the only creator; the
 * tmux hooks and tq only delete. tm deletes nothing: pi_attention_hook.sh and
 * read-time liveness pruning own that side.
 */
const ATTENTION_DIR = `${homedir()}/.local/state/pi/attention`;
type AttentionKind = "finished" | "input";
type AttentionEntry = {
	session_id: string;
	label: string;
	kind: AttentionKind;
	tmux_session: string; // display name
	tmux_session_id: string; // $id — the only stable handle hooks get back
	tmux_window: string; // @id
	tmux_pane: string; // %id
	cwd: string;
	pid: number;
	timestamp: number; // epoch ms
};

/** Event sounds: LGTM soundboard clips, with freedesktop theme fallbacks. */
const EVENT_SOUNDS = {
	input: { clip: "hey-team.mp3", fallback: "message-new-instant.oga" },
	finished: { clip: "bot-says-done.mp3", fallback: "complete.oga" },
} as const;

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Sound playback: resolve the player once (PipeWire first, PulseAudio
// fallback), then fire-and-forget each sound. The in-flight lookup promise
// itself is cached so concurrent callers await the same probe instead of
// reading an undefined result.
let playerPromise: Promise<string | undefined> | undefined;

function resolvePlayer(): Promise<string | undefined> {
	playerPromise ??= new Promise((resolve) => {
		const proc = spawn("sh", ["-c", "command -v pw-play || command -v paplay"], {
			stdio: ["ignore", "pipe", "ignore"],
		});
		let out = "";
		proc.stdout.on("data", (chunk) => (out += chunk));
		proc.on("error", () => resolve(undefined));
		proc.on("close", () => resolve(out.trim() || undefined));
	});
	return playerPromise;
}

// Desktop notifications: resolve notify-send once, cached like resolvePlayer.
// Headless hosts (no notification daemon) simply never notify.
let notifySendPromise: Promise<boolean> | undefined;

function resolveNotifySend(): Promise<boolean> {
	notifySendPromise ??= new Promise((resolve) => {
		const proc = spawn("sh", ["-c", "command -v notify-send"], {
			stdio: ["ignore", "ignore", "ignore"],
		});
		proc.on("error", () => resolve(false));
		proc.on("close", (code) => resolve(code === 0));
	});
	return notifySendPromise;
}

function notify(opts: {
	summary: string;
	body?: string;
	icon?: string;
	urgency?: Urgency;
	transient?: boolean;
}) {
	void resolveNotifySend().then((available) => {
		if (!available) return;
		const args = ["notify-send", "--app-name=Pi"];
		if (opts.icon) args.push(`--icon=${opts.icon}`);
		args.push(`--urgency=${opts.urgency ?? "normal"}`);
		if (opts.transient) args.push("--transient");
		args.push(opts.summary);
		if (opts.body) args.push(opts.body);
		const proc = spawn(args[0], args.slice(1), { stdio: "ignore" });
		proc.on("error", () => {}); // ENOENT race: never crash pi over a notification
		proc.unref();
	});
}

/**
 * tmux placement of THIS process, resolved via the calling pane's env (tmux
 * resolves "current" from $TMUX_PANE). Undefined outside tmux.
 */
async function getTmuxTarget(): Promise<
	{ session: string; sessionId: string; window: string; pane: string } | undefined
> {
	if (!process.env.TMUX) return undefined;
	try {
		const out = await new Promise<string>((resolve, reject) => {
			const proc = spawn(
				"tmux",
				["display-message", "-p", "#{session_name}\t#{session_id}\t#{window_id}\t#{pane_id}"],
				{ stdio: ["ignore", "pipe", "ignore"] },
			);
			let data = "";
			proc.stdout.on("data", (chunk) => (data += chunk));
			proc.on("close", () => resolve(data));
			proc.on("error", reject);
		});
		const [session, sessionId, window, pane] = out.trim().split("\t");
		if (!session || !sessionId || !window || !pane) return undefined;
		return { session, sessionId, window, pane };
	} catch {
		return undefined;
	}
}

function sessionIdFrom(ctx: unknown): string | undefined {
	try {
		const id = (ctx as { sessionManager?: { getSessionId?: () => unknown } })?.sessionManager?.getSessionId?.();
		return typeof id === "string" && id.length > 0 ? id : undefined;
	} catch {
		return undefined;
	}
}

function attentionFile(sessionId: string): string {
	// pi session ids are uuids; safe as filenames
	return `${ATTENTION_DIR}/${sessionId}.json`;
}

/** Write/update this session's attention entry (atomic via tmp+rename). */
function enqueueAttention(entry: AttentionEntry): void {
	try {
		mkdirSync(ATTENTION_DIR, { recursive: true });
		const tmp = `${ATTENTION_DIR}/.${entry.session_id}.tmp`;
		writeFileSync(tmp, JSON.stringify(entry));
		renameSync(tmp, attentionFile(entry.session_id));
	} catch {}
}

function dequeueAttention(sessionId: string | undefined): void {
	if (!sessionId) return;
	try {
		rmSync(attentionFile(sessionId), { force: true });
	} catch {}
}

function readAttention(sessionId: string): AttentionEntry | undefined {
	try {
		return JSON.parse(readFileSync(attentionFile(sessionId), "utf8")) as AttentionEntry;
	} catch {
		return undefined;
	}
}

/** How many OTHER sessions are currently waiting ("…and N more waiting"). */
function countOtherAttention(sessionId: string | undefined): number {
	try {
		return readdirSync(ATTENTION_DIR).filter((f) => f.endsWith(".json") && f !== `${sessionId}.json`).length;
	} catch {
		return 0;
	}
}

function suffix(n: number): string {
	return n > 0 ? ` — and ${n} more waiting` : "";
}

async function playSound(event: keyof typeof EVENT_SOUNDS) {
	const player = await resolvePlayer();
	if (!player) return;
	const { clip, fallback } = EVENT_SOUNDS[event];
	const file = existsSync(`${LGTM_SOUND_DIR}/${clip}`)
		? `${LGTM_SOUND_DIR}/${clip}`
		: `${FALLBACK_SOUND_DIR}/${fallback}`;
	try {
		const proc = spawn(player, [file], { stdio: "ignore" });
		proc.on("error", () => {}); // binary vanished between probe and spawn
		proc.unref();
	} catch {}
}

async function getTmuxSessionName(): Promise<string | undefined> {
	if (!process.env.TMUX) return undefined;
	try {
		const out = await new Promise<string>((resolve, reject) => {
			const proc = spawn("tmux", ["display-message", "-p", "#S"], { stdio: ["ignore", "pipe", "ignore"] });
			let data = "";
			proc.stdout.on("data", (chunk) => (data += chunk));
			proc.on("close", () => resolve(data));
			proc.on("error", reject);
		});
		const name = out.trim();
		return name || undefined;
	} catch {
		return undefined;
	}
}

/**
 * True when the interactive session is really done: agent idle, nothing
 * queued, and still idle after a short debounce (a settled run can be
 * immediately followed by a queued message or a continuation).
 * Returns false if the context went stale (session replaced/reloaded).
 */
async function reallyIdle(ctx: { isIdle(): boolean; hasPendingMessages(): boolean }): Promise<boolean> {
	if (!ctx.isIdle() || ctx.hasPendingMessages()) return false;
	await sleep(SETTLE_DEBOUNCE_MS);
	try {
		return ctx.isIdle() && !ctx.hasPendingMessages();
	} catch {
		return false; // stale context after session replacement/reload
	}
}

export default function (pi: ExtensionAPI) {
	let cwdBase = "pi";
	let sessionName: string | undefined;
	/** Off by default (music-friendly); /sound on re-enables it for the gag. Resets to muted on restart. */
	let soundEnabled = false;

	const label = async (): Promise<string> =>
		sessionName ?? (await getTmuxSessionName()) ?? cwdBase;

	pi.on("session_start", async (event, ctx) => {
		if (!ctx.hasUI) return;
		cwdBase = ctx.cwd.replace(/\/+$/, "").split("/").pop() || "pi";
		sessionName = pi.getSessionName() ?? undefined;
		// /reload migration catch-up: a session that reloaded while idle already
		// fired agent_settled under the previous extension code, so its entry
		// would never appear until the next run. Treat reload-time idleness as
		// "finished" — if the user is looking at the pane, the pane-focus-in hook
		// dequeues it again immediately, so this cannot resurrect read sessions.
		if (event.reason === "reload" && ctx.isIdle() && !ctx.hasPendingMessages()) {
			await enqueue("finished", ctx);
		}
	});

	pi.on("session_info_changed", async (event, ctx) => {
		sessionName = event.name;
		// Keep the queued attention entry in sync with renames (/name).
		const sessionId = sessionIdFrom(ctx);
		if (!sessionName || !sessionId) return;
		const entry = readAttention(sessionId);
		if (entry) {
			entry.label = sessionName;
			enqueueAttention(entry);
		}
	});

	// Toggle (or force on/off) the notification sounds without touching the
	// visual notifications. Usage: /sound, /sound on, /sound off.
	pi.registerCommand("sound", {
		description: "Toggle notification sounds (usage: /sound [on|off])",
		handler: async (args, ctx) => {
			const mode = args.trim().toLowerCase();
			soundEnabled = mode === "on" ? true : mode === "off" ? false : !soundEnabled;
			ctx.ui.notify(
				`Notification sounds ${soundEnabled ? "on" : "off (muted for this session)"}`,
				soundEnabled ? "info" : "warning",
			);
		},
	});

	/** Spool an attention entry for this session (tmux sessions only). */
	const enqueue = async (kind: AttentionKind, ctx: { hasUI: boolean }) => {
		if (!ctx.hasUI || !process.env.TMUX) return;
		const sessionId = sessionIdFrom(ctx);
		if (!sessionId) return;
		const target = await getTmuxTarget();
		if (!target) return;
		enqueueAttention({
			session_id: sessionId,
			label: await label(),
			kind,
			tmux_session: target.session,
			tmux_session_id: target.sessionId,
			tmux_window: target.window,
			tmux_pane: target.pane,
			cwd: process.cwd(),
			pid: process.pid,
			timestamp: Date.now(),
		});
	};

	// (1) Interaction needed: Pi is blocked on a user-facing prompt.
	pi.on("ui_prompt_start", async (event, ctx) => {
		if (!ctx.hasUI) return;
		// ask-user.ts raises SUPPRESS_NEXT_PROMPT_NOTIFY for follow-up prompts
		// (its "Write your own…" editor, or its option list re-shown after that
		// editor was cancelled): the user is visibly interacting, so one
		// notification per question is enough. Consume the flag exactly once and
		// fall through to the normal notification otherwise.
		const g = globalThis as Record<string, unknown>;
		if (g["__pi_askUser_suppressNextPromptNotification"] === true) {
			g["__pi_askUser_suppressNextPromptNotification"] = false;
			return;
		}
		const kindLabel =
			event.kind === "confirm"
				? "needs approval"
				: event.kind === "select"
					? "needs a choice"
					: "has a question";
		await enqueue("input", ctx);
		notify({
			summary: `${await label()}: Pi ${kindLabel}`,
			body: `${event.title ?? "Your input is needed"}${suffix(countOtherAttention(sessionIdFrom(ctx)))}`,
			icon: event.kind === "confirm" ? "dialog-password" : "dialog-question",
			urgency: "normal",
			transient: true,
		});
		if (soundEnabled) playSound("input");
	});

	// Work resumed (user sent a message): no longer waiting on the user.
	pi.on("agent_start", async (_event, ctx) => {
		dequeueAttention(sessionIdFrom(ctx));
	});

	// (2) Truly idle: settled, nothing queued, and still idle after debounce.
	pi.on("agent_settled", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		if (!(await reallyIdle(ctx))) return;
		await enqueue("finished", ctx);
		notify({
			summary: `${await label()}: Pi finished`,
			body: `Session is idle and waiting for input${suffix(countOtherAttention(sessionIdFrom(ctx)))}`,
			icon: "task-complete",
			urgency: "normal",
			transient: true,
		});
		if (soundEnabled) playSound("finished");
	});
}
