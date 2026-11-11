import { catalogue } from "./catalogue-data";
import { clarifyMessage, declineMessage, noMatchMessage } from "./copy";
import { filterCatalogue } from "./filter";
import { chatCompletion, type ChatFn } from "./llm";
import { parseRequest } from "./parse-request";
import { pickItems } from "./pick";
import type { RecommendResponse } from "./recommend-types";

export type RecommendOptions = {
  readonly chat?: ChatFn;
  readonly sessionId?: string;
};

function newID(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function recommend(
  message: string,
  options: RecommendOptions = {},
): Promise<RecommendResponse> {
  const started = Date.now();
  const chat = options.chat ?? chatCompletion;
  const sessionId = options.sessionId ?? newID("ses");
  const requestID = newID("req");

  const meta = (filtered: number, relaxed: readonly string[]) => ({
    request_id: requestID,
    filtered,
    relaxed,
    latency_ms: Date.now() - started,
  });

  const parsed = await parseRequest(message, sessionId, chat);

  if (parsed.intent === "decline") {
    return {
      state: "decline",
      message: declineMessage(parsed.decline_reason ?? "rules", parsed.language),
      items: [],
      meta: meta(0, []),
    };
  }

  if (parsed.intent === "clarify") {
    return {
      state: "clarify",
      message: clarifyMessage(
        parsed.missing,
        parsed.references_prior,
        parsed.language,
      ),
      items: [],
      meta: meta(0, []),
    };
  }

  const filtered = filterCatalogue(catalogue, parsed.request);

  if (filtered.reason !== "ok" || filtered.candidates.length === 0) {
    return {
      state: "no_match",
      message: noMatchMessage(filtered, parsed.request, parsed.language),
      items: [],
      meta: meta(filtered.total, filtered.relaxed),
    };
  }

  const picked = await pickItems(
    {
      message,
      sessionId,
      parsed,
      candidates: filtered.candidates,
      relaxed: filtered.relaxed,
    },
    chat,
  );

  if (picked.items.length === 0) {
    return {
      state: "no_match",
      message: noMatchMessage(filtered, parsed.request, parsed.language),
      items: [],
      meta: meta(filtered.total, filtered.relaxed),
    };
  }

  return {
    state: "recommend",
    message:
      picked.message ||
      (parsed.language === "hinglish"
        ? "Yeh pieces sabse close hain."
        : "Here are the closest pieces."),
    items: picked.items,
    meta: meta(filtered.total, filtered.relaxed),
  };
}
