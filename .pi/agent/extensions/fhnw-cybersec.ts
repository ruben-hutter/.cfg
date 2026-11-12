// FHNW CyberSec LLM provider (https://llm.cybersec-fhnw.org/v1)
//
// Registers an OpenAI-compatible provider whose model list is discovered live
// from GET /v1/models (mirrors Nico's pi-sync wrapper, but native):
//   - refreshModels() fetches the live catalog when network is allowed
//     (pi startup trigger below, opening /model, ...) and persists a snapshot.
//   - If the fetch fails or we're offline, the last persisted snapshot is used.
//   - If discovery has never succeeded, the static fallback list below applies.
//
// Authentication is pi's standard flow: run /login and enter the API key
// (or put an "api_key" credential with a "!command" key into auth.json).
// The extension carries no key; pi resolves the stored credential per
// request and hands it to refreshModels() as context.credential.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROVIDER_ID = "fhnw-cybersec";
const BASE_URL = "https://llm.cybersec-fhnw.org/v1";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_TOKENS = 65_536;
const DEFAULT_CONTEXT_WINDOW = 262_144;

type ModelEntry = { id: string; contextWindow: number };

// Fallback catalog (verified against the live endpoint on 2026-07-23).
const FALLBACK_MODELS: ModelEntry[] = [
	{ id: "deepseek-v4.1-flash-1017", contextWindow: 1_048_576 },
	{ id: "qwen3.8-flash-next-strix", contextWindow: 262_144 },
	{ id: "glm-5.3-flash-nvfp4", contextWindow: 1_048_576 },
];

// Nico's template: every model is a reasoning model using chat-template thinking kwargs.
function templateModel({ id, contextWindow }: ModelEntry) {
	return {
		type: "chat" as const,
		id,
		name: id,
		reasoning: true,
		thinkingLevelMap: {
			minimal: null,
			low: "low",
			medium: null,
			high: "high",
			xhigh: null,
			max: "max",
		},
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow,
		maxTokens: MAX_TOKENS,
	};
}

function isPositiveNumber(value: unknown): value is number {
	return typeof value === "number" && value > 0;
}

// Every model is built from the template, so only id + contextWindow matter
// from the persisted snapshot; everything else is regenerated.
function storedEntries(stored: { models?: any[] } | undefined): ModelEntry[] {
	return (stored?.models ?? [])
		.filter((m) => typeof m?.id === "string" && (!m.type || m.type === "chat"))
		.map((m) => ({
			id: m.id,
			contextWindow: isPositiveNumber(m.contextWindow) ? m.contextWindow : DEFAULT_CONTEXT_WINDOW,
		}));
}

// Server metadata wins for contextWindow; otherwise use what we already know
// about the model (snapshot first, then fallback list), then the default.
async function fetchLiveCatalog(
	key: string,
	known: ModelEntry[],
	signal?: AbortSignal,
): Promise<ModelEntry[]> {
	const signals = [AbortSignal.timeout(FETCH_TIMEOUT_MS)];
	if (signal) signals.push(signal);

	const response = await fetch(`${BASE_URL}/models`, {
		headers: { Authorization: `Bearer ${key}` },
		signal: AbortSignal.any(signals),
	});
	if (!response.ok) throw new Error(`GET ${BASE_URL}/models -> ${response.status}`);

	const body = await response.json();
	const entries: ModelEntry[] = (body?.data ?? [])
		.filter((m: any) => typeof m?.id === "string" && m.id.length > 0)
		.map((m: any) => {
			const ctx = m.max_model_len ?? m.context_length;
			return {
				id: m.id,
				contextWindow: isPositiveNumber(ctx)
					? ctx
					: (known.find((k) => k.id === m.id)?.contextWindow ?? DEFAULT_CONTEXT_WINDOW),
			};
		});
	if (entries.length === 0) throw new Error("server returned no models");
	return entries;
}

export default function (pi: ExtensionAPI) {
	pi.registerProvider(PROVIDER_ID, {
		name: "FHNW CyberSec LLM",
		baseUrl: BASE_URL,
		api: "openai-completions",
		models: FALLBACK_MODELS.map(templateModel),
		compat: {
			supportsReasoningEffort: false,
			thinkingFormat: "chat-template",
			chatTemplateKwargs: {
				thinking: { $var: "thinking.enabled" },
				reasoning_effort: { $var: "thinking.effort", omitWhenOff: true },
			},
		},
		refreshModels: async (context) => {
			// Effective credential pi resolved from auth storage (auth.json).
			const key = context.credential?.type === "api_key" ? context.credential.key : undefined;
			const stored = storedEntries(context.stored);

			let live: ModelEntry[] | undefined;
			if (context.allowNetwork && key) {
				try {
					live = await fetchLiveCatalog(key, [...stored, ...FALLBACK_MODELS], context.signal);
				} catch {
					// Server unreachable: fall through to the last synced snapshot.
				}
			}

			// Only a successful live fetch refreshes the snapshot (and its checkedAt).
			if (live) {
				const models = live.map(templateModel);
				await context.publish({ persist: { models, checkedAt: Date.now() } });
				return models;
			}

			return (stored.length > 0 ? stored : FALLBACK_MODELS).map(templateModel);
		},
	});

	// Sync the live catalog in the background when a session starts.
	// Never block or crash startup on model discovery.
	pi.on("session_start", (_event, ctx) => {
		Promise.resolve()
			.then(() => ctx.modelRegistry.refresh({ allowNetwork: true, providers: [PROVIDER_ID] }))
			.catch(() => {});
	});
}
