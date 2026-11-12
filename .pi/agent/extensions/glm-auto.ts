// GLM auto router — virtual model `zai/auto` that routes between
// glm-5.3-flash (cheap/fast) and glm-5.3 (strong) per request.
//
// Decision for each new user message (in order):
//   1. Prompt contains images -> flash (the only multimodal model of the pair).
//   2. Text <= SIMPLE_LIMIT chars -> flash, no extra call.
//   3. Text >= HARD_LIMIT chars -> glm-5.3, no extra call.
//   4. In between -> one judge call that answers SIMPLE or COMPLEX;
//      route accordingly.
//
// The judge runs locally first: qwen2.5:1.5b-instruct via Ollama
// (user service, 127.0.0.1:11434), constrained to answer exactly
// SIMPLE or COMPLEX. Zero API cost, no network round-trip. If Ollama
// is down or unparseable, fall back to a glm-5.3-flash judge call;
// if that fails too, route to flash.
//
// Tool follow-ups and retries stay on the model already handling the turn
// (prompt-cache friendly). `direct` requests outside the agent loop, such as
// compaction summaries, go to flash.
//
// Configure with env vars:
//   PI_AUTO_JUDGE_URL    Ollama base URL  (default http://127.0.0.1:11434)
//   PI_AUTO_JUDGE_MODEL  judge model tag  (default qwen2.5:1.5b-instruct)
//
// Usage: select `zai/auto` in /model, or start with `pi --model zai/auto`.
// The footer shows the routed model, e.g. `auto • high → glm-5.3 • medium`.

import type { Message } from "@earendil-works/pi-ai";
import type {
	ExtensionAPI,
	ExtensionContext,
	ModelRoute,
	ModelRouteRequest,
} from "@earendil-works/pi-coding-agent";

const PROVIDER = "zai";
const FLASH = "glm-5.3-flash";
const BIG = "glm-5.3";

// Heuristic band; outside it no judge call is made.
const SIMPLE_LIMIT = 160; // chars below which a prompt is trivially simple
const HARD_LIMIT = 1_200; // chars above which a prompt is trivially complex

const JUDGE_MAX_CHARS = 16_000;
const LOCAL_TIMEOUT_MS = 10_000; // cold model load can take a few seconds
const REMOTE_TIMEOUT_MS = 5_000;

const OLLAMA_URL = process.env.PI_AUTO_JUDGE_URL ?? "http://127.0.0.1:11434";
const JUDGE_MODEL = process.env.PI_AUTO_JUDGE_MODEL ?? "qwen2.5:1.5b-instruct";

const JUDGE_SYSTEM =
	"You are a request router for a coding agent. Rate how demanding the " +
	"user's request is for the software engineer who must act on it. " +
	"Reply with exactly one word: SIMPLE or COMPLEX.\n" +
	"SIMPLE: quick questions, explanations, one-file tweaks, running " +
	"commands, rephrasing, straightforward edits. Wording changes to " +
	"messages, comments, docs, or variable names are always SIMPLE no " +
	"matter which file they live in.\n" +
	"COMPLEX: multi-file or cross-cutting changes, debugging subtle " +
	"behavior, design or architecture work, security or performance " +
	"sensitivity, anything with non-obvious failure modes.\n" +
	"If unsure, answer COMPLEX.";

function findModel(ctx: ExtensionContext, id: string) {
	return ctx.modelRegistry.find(PROVIDER, id);
}

function routeTo(request: ModelRouteRequest, ctx: ExtensionContext, id: string): ModelRoute {
	const model = findModel(ctx, id);
	if (!model) throw new Error(`Model ${PROVIDER}/${id} is not in the catalog`);
	return { model, thinkingLevel: request.thinkingLevel };
}

function lastUserMessage(messages: readonly Message[]): Message | undefined {
	return messages.findLast((message) => message.role === "user");
}

function userText(message: Message | undefined): string {
	if (!message) return "";
	if (typeof message.content === "string") return message.content;
	return message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("\n");
}

function hasImages(message: Message | undefined): boolean {
	if (!message) return false;
	return typeof message.content !== "string" && message.content.some((block) => block.type === "image");
}

/**
 * Local judge via Ollama. Resolves to `true` (COMPLEX), `false` (SIMPLE), or
 * `undefined` when the local judge is unavailable (server down, model
 * missing, timeout, unparseable answer) — the caller then falls back to the
 * remote judge.
 */
async function judgeLocal(prompt: string, signal: AbortSignal | undefined): Promise<boolean | undefined> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), LOCAL_TIMEOUT_MS);
	const forward = () => controller.abort();
	signal?.addEventListener("abort", forward);
	try {
		const res = await fetch(`${OLLAMA_URL}/api/chat`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				model: JUDGE_MODEL,
				stream: false,
				// Constrain decoding to a JSON string with exactly these two
				// values — tiny models can't ramble or break the format.
				format: { type: "string", enum: ["SIMPLE", "COMPLEX"] },
				options: { temperature: 0, num_predict: 5 },
				messages: [
					{ role: "system", content: JUDGE_SYSTEM },
					{ role: "user", content: prompt.slice(0, JUDGE_MAX_CHARS) },
				],
			}),
			signal: controller.signal,
		});
		if (!res.ok) return undefined;
		const body = (await res.json()) as { message?: { content?: string } };
		const text = body.message?.content ?? "";
		// `format` yields a quoted JSON string, e.g. `"COMPLEX"`.
		if (!/SIMPLE|COMPLEX/i.test(text)) return undefined;
		return /COMPLEX/i.test(text);
	} catch {
		return undefined;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener("abort", forward);
	}
}

/**
 * Remote fallback judge on glm-5.3-flash. Resolves to `true` (COMPLEX) or
 * `false` (SIMPLE); any failure — error, timeout, unparseable answer —
 * resolves to `false`, routing to flash.
 */
async function judgeRemote(prompt: string, ctx: ExtensionContext, signal: AbortSignal | undefined): Promise<boolean> {
	const judgeModel = findModel(ctx, FLASH);
	if (!judgeModel) return false;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
	const forward = () => controller.abort();
	signal?.addEventListener("abort", forward);
	try {
		const stream = ctx.modelRegistry.streamSimple(
			judgeModel,
			{
				systemPrompt: JUDGE_SYSTEM,
				messages: [
					{ role: "user", content: prompt.slice(0, JUDGE_MAX_CHARS), timestamp: Date.now() },
				],
			},
			// Omitting `reasoning` disables thinking on zai — fastest possible judge call.
			{ signal: controller.signal },
		);
		const message = await stream.result();
		if (message.stopReason !== "stop" && message.stopReason !== "length") return false;
		const text = message.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join(" ");
		return /complex/i.test(text);
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener("abort", forward);
	}
}

export default function (pi: ExtensionAPI) {
	pi.registerVirtualModel({
		provider: PROVIDER,
		id: "auto",
		name: "Auto (GLM)",
		thinkingLevels: ["off", "low", "high"],
		// Both models share these limits; shown before the first response.
		contextWindow: 1_000_000,
		maxTokens: 131_072,
		async route(request, ctx) {
			// Requests outside the agent loop (compaction summaries, etc.): flash.
			if (request.reason === "direct") return routeTo(request, ctx, FLASH);

			// Tool follow-ups and retries stay on the model handling the turn.
			if (request.reason !== "user") {
				const sticky = request.failed ?? request.previous;
				if (sticky) {
					return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? request.thinkingLevel };
				}
			}

			const last = lastUserMessage(request.messages);
			// Only flash is multimodal: image prompts always go there.
			if (hasImages(last)) return routeTo(request, ctx, FLASH);

			const text = userText(last);
			if (text.length <= SIMPLE_LIMIT) return routeTo(request, ctx, FLASH);
			if (text.length >= HARD_LIMIT) return routeTo(request, ctx, BIG);

			// Local judge first; remote flash judge only if Ollama is unavailable.
			const complex = (await judgeLocal(text, request.signal)) ?? (await judgeRemote(text, ctx, request.signal));
			return routeTo(request, ctx, complex ? BIG : FLASH);
		},
	});
}
