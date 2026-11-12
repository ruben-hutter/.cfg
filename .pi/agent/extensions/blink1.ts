/**
 * blink(1) extension for Pi.
 *
 * Ported from the opencode plugin of the same name. Requires the blink1
 * HTTP server (e.g. `blink1control2` or `blink1-tool server`) on localhost:8934.
 *
 * Behavior (interactive session only — child pi processes such as subagents
 * running in print mode are silenced via ctx.hasUI so they never touch the LED):
 * - Single flash in the session's color when a prompt is submitted.
 * - Continuous blinking while Pi waits on a blocking UI prompt
 *   (confirmation dialogs, questions, inputs) — but only until the user
 *   shows up: when running inside tmux, each blink probes the session and
 *   the LED stops for the rest of the prompt once a client is attached AND
 *   viewing pi's window (you're reading; blinking at a reader is noise).
 *   Outside tmux there is no presence signal, so it blinks until answered.
 * - Triple flash when the session is truly idle: agent settled, nothing
 *   queued, and still idle after a short debounce.
 */

import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PALETTE = [
	"FF0000",
	"00FF00",
	"0066FF",
	"FFDD00",
	"00FFFF",
	"FF00FF",
	"FF8800",
	"FFFFFF",
];

const BLINK1_URL = "http://localhost:8934";
const SETTLE_DEBOUNCE_MS = 2000;

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function sessionColor(sessionId: string): string {
	let hash = 0;
	for (let i = 0; i < sessionId.length; i++) {
		hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0;
	}
	return PALETTE[Math.abs(hash) % PALETTE.length];
}

async function blink1Flash(rgb: string, count: number, millis = 300) {
	try {
		await fetch(`${BLINK1_URL}/blink1/blink?rgb=${rgb}&count=${count}&millis=${millis}`);
	} catch {}
}

async function blink1Off() {
	try {
		await fetch(`${BLINK1_URL}/blink1/off`);
	} catch {}
}

const BLINK_INTERVAL = 1300;
let blinkTimer: ReturnType<typeof setInterval> | null = null;
/** Depth of concurrently open blocking UI prompts. */
let pendingPrompts = 0;
/**
 * Set once the user has shown up for the current prompt (tmux client
 * attached and viewing pi's window). Blinking then stays off for the rest
 * of this prompt — no resume if they detach again mid-read; they've seen it.
 */
let userPresent = false;

/** Pane pi's TUI lives in (empty when pi runs outside tmux). */
const TMUX_PANE = process.env.TMUX_PANE;

/**
 * Presence probe for the tmux session pi runs in: is a client attached, and
 * is it currently viewing pi's window? Returns undefined outside tmux or on
 * tmux failure — in that case blinking never auto-stops (old behavior).
 */
async function tmuxPresence(): Promise<{ attached: boolean; viewing: boolean } | undefined> {
	if (!TMUX_PANE) return undefined;
	try {
		const out = await new Promise<string>((resolve, reject) => {
			const proc = spawn(
				"tmux",
				["display-message", "-p", "-t", TMUX_PANE, "#{session_attached} #{window_active}"],
				{ stdio: ["ignore", "pipe", "ignore"] },
			);
			let data = "";
			proc.stdout.on("data", (chunk) => (data += chunk));
			proc.on("error", reject);
			proc.on("close", () => resolve(data));
		});
		const [attached, viewing] = out.trim().split(/\s+/);
		return { attached: Number(attached) > 0, viewing: viewing === "1" };
	} catch {
		return undefined;
	}
}

async function blinkTick(color: string) {
	if (!userPresent) {
		const presence = await tmuxPresence();
		if (presence?.attached && presence.viewing) {
			// They connected and are looking at this window — stop for good.
			stopTimer(); // also turns the LED off
			return;
		}
	}
	void blink1Flash(color, 5, 200);
}

function startTimer(color: string) {
	if (blinkTimer) return;
	userPresent = false;
	blink1Flash(color, 5, 200);
	blinkTimer = setInterval(() => void blinkTick(color), BLINK_INTERVAL);
}

function stopTimer() {
	if (blinkTimer) {
		clearInterval(blinkTimer);
		blinkTimer = null;
		void blink1Off();
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		const color = sessionColor(ctx.sessionManager.getSessionId());
		void blink1Flash(color, 1, 500);
	});

	pi.on("ui_prompt_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		pendingPrompts++;
		startTimer(sessionColor(ctx.sessionManager.getSessionId()));
	});

	pi.on("ui_prompt_end", async () => {
		pendingPrompts = Math.max(0, pendingPrompts - 1);
		if (pendingPrompts === 0) stopTimer();
	});

	// Triple flash only when truly settled: nothing queued, still idle after
	// a short debounce (a settled run can be followed by queued work).
	pi.on("agent_settled", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		if (!ctx.isIdle() || ctx.hasPendingMessages()) return;
		await sleep(SETTLE_DEBOUNCE_MS);
		try {
			if (!ctx.isIdle() || ctx.hasPendingMessages()) return;
		} catch {
			return; // stale context after session replacement/reload
		}
		pendingPrompts = 0;
		stopTimer();
		void blink1Flash(sessionColor(ctx.sessionManager.getSessionId()), 3, 300);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		try {
			if (!ctx.hasUI) return;
		} catch {
			return;
		}
		pendingPrompts = 0;
		stopTimer();
		void blink1Off();
	});
}
