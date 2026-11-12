/**
 * Ask-user tool for Pi.
 *
 * Registers a model-callable `ask_user` tool so the agent can ask a question
 * (with optional answer options) and wait for your reply. Blocking UI prompts
 * fire `ui_prompt_start`/`ui_prompt_end`, which drives the blink1 and notify
 * extensions: the LED blinks in the session color and a desktop notification
 * is sent while the question is open.
 *
 * Notification policy — one notification per question: only the FIRST prompt
 * of an interaction notifies (option select, or the free-text editor when the
 * question has no options). Follow-up prompts raise SUPPRESS_NEXT_PROMPT_NOTIFY
 * (consumed by notify.ts) because the user is visibly interacting: the
 * multi-line editor opened via "Write your own…", or the option list re-shown
 * after the editor was cancelled. The blink1 LED keeps blinking throughout.
 *
 * The editor dialog word-wraps long text and supports ctrl+g to continue in
 * the external editor ($VISUAL/$EDITOR, e.g. nvim) on a temp file — same as
 * ctrl+g in the normal prompt.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const params = {
	type: "object",
	properties: {
		question: {
			type: "string",
			description: "The question to ask the user. Be specific and self-contained.",
		},
		options: {
			type: "array",
			items: { type: "string" },
			description:
				"Optional list of 2-6 suggested answers. Omit for a free-text answer.",
		},
	},
	required: ["question"],
} as any;

/**
 * globalThis flag shared with notify.ts (same process; no import so the two
 * extensions stay independently loadable). While set, notify.ts skips the
 * desktop notification for the next blocking prompt. Always consumed exactly
 * once and cleared after each dialog returns, so it can never go stale.
 */
const SUPPRESS_NEXT_PROMPT_NOTIFY = "__pi_askUser_suppressNextPromptNotification";

function suppressNextPromptNotify() {
	(globalThis as Record<string, unknown>)[SUPPRESS_NEXT_PROMPT_NOTIFY] = true;
}

function clearSuppressNextPromptNotify() {
	(globalThis as Record<string, unknown>)[SUPPRESS_NEXT_PROMPT_NOTIFY] = false;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "ask_user",
		label: "Ask user",
		description:
			"Ask the user a question and block until they answer. Use this whenever you are " +
			"uncertain about requirements, a decision, a destructive action, or a choice " +
			"between plausible approaches — prefer asking over guessing. " +
			"The user can always write their own answer in addition to the provided options.",
		parameters: params,
		executionMode: "sequential",

		async execute(_toolCallId, p: { question: string; options?: string[] }, _signal, _onUpdate, ctx) {
			const options = (p.options ?? []).filter((o) => typeof o === "string" && o.trim());
			const CUSTOM_OPTION = "✎ Write your own…";
			let answer: string | undefined;

			// Multi-line, word-wrapped editor dialog. Enter submits,
			// shift+enter inserts a newline, escape cancels (-> undefined),
			// ctrl+g opens the external editor (nvim) on a temp file.
			const askFreeText = () => ctx.ui.editor(p.question);

			if (options.length >= 2 && ctx.hasUI) {
				// Loop so cancelling the free-text editor returns to the option list.
				// Only the first dialog notifies; every re-shown dialog suppresses.
				let firstPrompt = true;
				for (;;) {
					if (!firstPrompt) suppressNextPromptNotify();
					const choice = await ctx.ui.select(p.question, [...options, CUSTOM_OPTION]);
					clearSuppressNextPromptNotify();
					firstPrompt = false;
					if (choice === undefined) break; // dismissed
					if (choice !== CUSTOM_OPTION) {
						answer = choice;
						break;
					}
					suppressNextPromptNotify();
					const custom = await askFreeText();
					clearSuppressNextPromptNotify();
					if (custom !== undefined && custom.trim()) {
						answer = custom.trim();
						break;
					}
				}
			} else if (ctx.hasUI) {
				// No options: this editor IS the first (and only) prompt, so it notifies.
				answer = (await askFreeText())?.trim() || undefined;
			}

			if (answer === undefined || answer === "") {
				return {
					content: [{ type: "text", text: "The user dismissed the question. Continue with your best judgment and state your assumption." }],
					details: { question: p.question, options, answer: null },
				};
			}

			return {
				content: [{ type: "text", text: `User's answer: ${answer}` }],
				details: { question: p.question, options, answer },
			};
		},
	});
}
