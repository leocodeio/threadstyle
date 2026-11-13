import type { CatalogueItem } from "./catalogue";
import { catalogue } from "./catalogue-data";
import {
  PARSER_TIMEOUT_MS,
  PICKER_RETRY_TIMEOUT_MS,
  PICKER_TIMEOUT_MS,
  REQUEST_DEADLINE_MS,
} from "./config";
import {
  audienceNote,
  clarifyMessage,
  declineMessage,
  noMatchMessage,
  otherStoreMessage,
} from "./copy";
import { filterCatalogue } from "./filter";
import { chatCompletion, type ChatFn } from "./llm";
import { isAffirmation, mergePrior, missingFor } from "./memory";
import { parseRequest } from "./parse-request";
import { pickItems } from "./pick";
import type {
  ParsedRequest,
  PriorRequest,
  RecommendResponse,
} from "./recommend-types";

export type RecommendOptions = {
  readonly chat?: ChatFn;
  readonly sessionId?: string;
  readonly prior?: PriorRequest | null;
};

function newID(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function priorState(
  parsed: ParsedRequest,
  message: string,
  offer = false,
): PriorRequest {
  return {
    request: parsed.request,
    missing: parsed.missing,
    last_message: message,
    language: parsed.language,
    ...(offer ? { offer: true } : {}),
  };
}

function isOtherStore(brand: string | null): brand is string {
  return brand !== null && !brand.toLowerCase().includes("bewakoof");
}

function fromOffer(prior: PriorRequest): ParsedRequest {
  return {
    intent: "recommend",
    language: prior.language ?? "en",
    references_prior: false,
    missing: [],
    decline_reason: null,
    request: { ...prior.request, brand_other: null },
  };
}

export async function recommend(
  message: string,
  options: RecommendOptions = {},
): Promise<RecommendResponse> {
  const started = Date.now();
  const deadline = started + REQUEST_DEADLINE_MS;
  const chat = options.chat ?? chatCompletion;
  const sessionId = options.sessionId ?? newID("ses");
  const requestID = newID("req");

  const meta = (
    filtered: number,
    relaxed: readonly string[],
    prior: PriorRequest | null,
  ) => ({
    request_id: requestID,
    filtered,
    relaxed,
    latency_ms: Date.now() - started,
    prior,
  });

  const prior = options.prior ?? null;
  const accepted =
    prior !== null && prior.offer === true && isAffirmation(message);

  const parsed = accepted
    ? fromOffer(prior)
    : await parseRequest(message, sessionId, chat, {
        timeoutMs: Math.min(
          PARSER_TIMEOUT_MS,
          Math.max(1_000, deadline - Date.now()),
        ),
      });
  const merged = accepted
    ? { parsed, used_prior: true }
    : mergePrior(parsed, prior, message);
  const effective = merged.parsed;

  if (
    effective.intent !== "decline" &&
    isOtherStore(effective.request.brand_other)
  ) {
    const clean = { ...effective.request, brand_other: null };
    const missing = missingFor(clean);
    const offer = missing.length === 0;
    return {
      state: "no_match",
      message: otherStoreMessage(
        effective.request,
        missing,
        effective.language,
      ),
      items: [],
      meta: meta(
        0,
        [],
        priorState(
          { ...effective, request: clean, missing },
          message,
          offer,
        ),
      ),
    };
  }

  if (effective.intent === "decline") {
    return {
      state: "decline",
      message: declineMessage(
        effective.decline_reason ?? "rules",
        effective.language,
      ),
      items: [],
      meta: meta(0, [], null),
    };
  }

  if (effective.intent === "clarify") {
    const keepPrior = merged.used_prior || !effective.references_prior;
    return {
      state: "clarify",
      message: clarifyMessage(
        effective.missing,
        effective.references_prior,
        effective.language,
      ),
      items: [],
      meta: meta(
        0,
        [],
        keepPrior ? priorState(effective, message) : null,
      ),
    };
  }

  const filtered = filterCatalogue(catalogue, effective.request);
  const currentPrior = priorState(effective, message);

  if (filtered.reason !== "ok" || filtered.candidates.length === 0) {
    return {
      state: "no_match",
      message: noMatchMessage(
        filtered,
        effective.request,
        effective.language,
      ),
      items: [],
      meta: meta(filtered.total, filtered.relaxed, currentPrior),
    };
  }

  const picked = await pickItems(
    {
      message,
      sessionId,
      parsed: effective,
      candidates: filtered.candidates,
      relaxed: filtered.relaxed,
    },
    chat,
    {
      timeoutMs: Math.min(
        PICKER_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now()),
      ),
      retryTimeoutMs: Math.min(
        PICKER_RETRY_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now()),
      ),
      deadline,
    },
  );

  if (picked.items.length === 0) {
    return {
      state: "no_match",
      message: noMatchMessage(
        filtered,
        effective.request,
        effective.language,
      ),
      items: [],
      meta: meta(filtered.total, filtered.relaxed, currentPrior),
    };
  }

  const headline =
    picked.message ||
    (effective.language === "hinglish"
      ? "Yeh pieces sabse close hain."
      : "Here are the closest pieces.");
  const note = audienceNoteFor(effective, picked.items);

  return {
    state: "recommend",
    message: note === null ? headline : `${headline} ${note}`,
    items: picked.items,
    meta: meta(filtered.total, filtered.relaxed, currentPrior),
  };
}

// When the student never said men's or women's, say which one is shown and
// how to switch, but only if the other audience exists for these categories.
function audienceNoteFor(
  parsed: ParsedRequest,
  items: readonly { readonly item: CatalogueItem }[],
): string | null {
  if (parsed.request.audience !== null || items.length === 0) return null;

  const audiences = new Set(items.map((entry) => entry.item.audience));
  const shown = [...audiences].filter(
    (value): value is "men" | "women" => value === "men" || value === "women",
  );
  if (shown.length !== 1 || audiences.size !== 1) return null;

  const only = shown[0];
  if (only === undefined) return null;
  const categories = new Set(items.map((entry) => entry.item.category));
  const otherExists = catalogue.some(
    (item) =>
      categories.has(item.category) &&
      item.audience !== only &&
      item.audience !== "unisex",
  );

  return otherExists ? audienceNote(only, parsed.language) : null;
}
