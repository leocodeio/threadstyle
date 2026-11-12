import { catalogue } from "./catalogue-data";
import {
  PARSER_TIMEOUT_MS,
  PICKER_RETRY_TIMEOUT_MS,
  PICKER_TIMEOUT_MS,
  REQUEST_DEADLINE_MS,
} from "./config";
import { clarifyMessage, declineMessage, noMatchMessage } from "./copy";
import { filterCatalogue } from "./filter";
import { chatCompletion, type ChatFn } from "./llm";
import { mergePrior } from "./memory";
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

function priorState(parsed: ParsedRequest, message: string): PriorRequest {
  return {
    request: parsed.request,
    missing: parsed.missing,
    last_message: message,
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

  const parsed = await parseRequest(message, sessionId, chat, {
    timeoutMs: Math.min(
      PARSER_TIMEOUT_MS,
      Math.max(1_000, deadline - Date.now()),
    ),
  });
  const merged = mergePrior(parsed, options.prior ?? null, message);
  const effective = merged.parsed;

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

  return {
    state: "recommend",
    message:
      picked.message ||
      (effective.language === "hinglish"
        ? "Yeh pieces sabse close hain."
        : "Here are the closest pieces."),
    items: picked.items,
    meta: meta(filtered.total, filtered.relaxed, currentPrior),
  };
}
