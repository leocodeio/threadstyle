import {
  CATEGORY_LABELS,
  CATEGORY_SINGULAR,
  formatINR,
  type CatalogueItem,
} from "./catalogue";
import {
  MAX_ITEMS,
  MAX_OUTPUT_TOKENS,
  PICKER_RETRY_TIMEOUT_MS,
  PICKER_TIMEOUT_MS,
} from "./config";
import { LlmError, requestJson, type ChatFn } from "./llm";
import { ensureHeadline, groundingFailure, headlineFor } from "./grounding";
import type { ParsedRequest } from "./recommend-types";
import {
  PICKER_SYSTEM,
  pickerUser,
  type PickerCandidate,
} from "../prompts/picker";
import { pickerOutputSchema, type PickerOutput } from "./recommend-types";

export type PickInput = {
  readonly message: string;
  readonly sessionId: string;
  readonly parsed: ParsedRequest;
  readonly candidates: readonly CatalogueItem[];
  readonly relaxed: readonly string[];
};

export type PickedItem = {
  readonly item: CatalogueItem;
  readonly why: string;
  readonly trade_off: string;
};

export type PickResult = {
  readonly message: string;
  readonly items: readonly PickedItem[];
};

export type PickOptions = {
  readonly timeoutMs?: number;
  readonly retryTimeoutMs?: number;
  readonly deadline?: number;
};

// Catalogue tags use snake_case; never show them to a student as written.
function humanize(value: string): string {
  return value
    .replace(/hot_humid/gi, "hot and humid")
    .replace(/self_design/gi, "self-design")
    .replace(/\b([a-z]+)_([a-z]+)\b/gi, "$1 $2");
}

function trimWords(value: string, max: number): string {
  const clean = humanize(value).trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  if (words.length <= max) return clean;
  return `${words.slice(0, max).join(" ").replace(/[,;:]$/, "")}…`;
}

function toCandidate(item: CatalogueItem): PickerCandidate {
  return {
    item_id: item.item_id,
    name: item.name,
    category: item.category,
    price_inr: item.price_inr,
    colour: item.colour,
    fabric: item.fabric,
    fit: item.fit,
    pattern: item.pattern,
    weather: item.weather,
    formality: item.formality,
    care: item.care,
    use_tags: item.use_tags,
  };
}

function fallbackWhy(item: CatalogueItem, parsed: ParsedRequest): string {
  const label = CATEGORY_SINGULAR[item.category];
  const price = formatINR(item.price_inr);
  const budget = parsed.request.budget_max_inr;
  const fit = item.fit.toLowerCase();
  const colour = item.colour.toLowerCase();
  const fabric = item.fabric.trim();
  const climate =
    parsed.request.weather !== null && item.weather === parsed.request.weather
      ? parsed.request.weather === "hot_humid"
        ? "hot, humid weather"
        : parsed.request.weather === "cold"
          ? "cold weather"
          : null
      : null;
  const occasion = parsed.request.use_tags[0] ?? null;

  if (parsed.language === "hinglish") {
    const parts = [`${colour} ${label}, ${price} mein`];
    if (fabric !== "") parts.push(fabric);
    if (climate !== null) parts.push(`${climate} ke liye sahi`);
    if (occasion !== null) parts.push(`${occasion} ke liye`);
    const head = parts.join(", ");
    return budget === null
      ? `${head}.`
      : `${head} — ${formatINR(budget)} ke andar.`;
  }

  const parts = [`${fit} ${colour} ${label} at ${price}`];
  if (fabric !== "") parts.push(`in ${fabric}`);
  let head = parts.join(" ");
  if (climate !== null) head += `, suited to ${climate}`;
  if (occasion !== null) head += `, for ${occasion}`;
  head = head.charAt(0).toUpperCase() + head.slice(1);
  return budget === null
    ? `${head}.`
    : `${head} — inside your ${formatINR(budget)} budget.`;
}

function fallbackTradeOff(item: CatalogueItem, parsed: ParsedRequest): string {
  const hinglish = parsed.language === "hinglish";
  const fit = item.fit.toLowerCase();

  if (fit.includes("oversized") || fit.includes("super loose")) {
    return hinglish
      ? "Oversized fit hai, baggy lag sakta hai — size chart check kar lena."
      : "Oversized fit may look baggy; check the size chart.";
  }

  if (fit.includes("slim")) {
    return hinglish
      ? "Slim fit body ke close baithta hai."
      : "Slim fit sits close to the body.";
  }

  if (item.care.toLowerCase().includes("gentle")) {
    return hinglish
      ? "Gentle wash hai, thoda care chahiye."
      : "Gentle machine wash — give it a little care.";
  }

  if (item.weather === "cold" && parsed.request.weather === "hot_humid") {
    return hinglish
      ? "Peak summer se zyada cooler days ke liye."
      : "Better for cooler days than peak summer.";
  }

  const fabric = item.fabric.toLowerCase();
  if (fabric.includes("viscose") || fabric.includes("rayon")) {
    return hinglish
      ? "Viscose hai — wash ke baad crease aa sakta hai."
      : "Viscose can crease after a wash; follow the care label.";
  }

  const pattern = item.pattern.toLowerCase();
  if (
    pattern.includes("graphic") ||
    pattern.includes("print") ||
    pattern.includes("typography")
  ) {
    return hinglish
      ? "Print hai — zyada washes ke baad thoda fade ho sakta hai."
      : "The print may fade a little after repeated washes.";
  }

  if (/white|cream|beige|light/.test(item.colour.toLowerCase())) {
    return hinglish
      ? "Light colour hai — marks jaldi dikhte hain."
      : "A light colour shows marks faster.";
  }

  if (item.rating === null || item.rating === undefined) {
    return hinglish
      ? "Abhi rating nahi hai — size chart check kar lena."
      : "No rating yet — check the size chart.";
  }

  return hinglish
    ? "Order se pehle size chart check kar lena."
    : "Check the size chart before ordering.";
}

function fallbackMessage(input: PickInput): string {
  const { request } = input.parsed;
  const label =
    request.categories.length > 0
      ? request.categories
          .map((category) => CATEGORY_LABELS[category].toLowerCase())
          .join(" or ")
      : "pieces";
  const budget = request.budget_max_inr;

  if (input.parsed.language === "hinglish") {
    return budget === null
      ? `Yeh ${label} sabse close hain.`
      : `Yeh ${label} ${formatINR(budget)} ke andar sabse close hain.`;
  }

  return budget === null
    ? `These are the closest ${label} I could find.`
    : `These are the closest ${label} inside ${formatINR(budget)}.`;
}

type Audience = CatalogueItem["audience"];

function chooseAudience(items: readonly PickedItem[]): Audience | null {
  const top = items[0];
  if (!top) return null;
  if (top.item.audience !== "unisex") return top.item.audience;
  return (
    items.find((entry) => entry.item.audience !== "unisex")?.item.audience ??
    null
  );
}

function keepAudience(
  items: readonly PickedItem[],
  audience: Audience,
): PickedItem[] {
  return items.filter(
    (entry) =>
      entry.item.audience === audience || entry.item.audience === "unisex",
  );
}

function fallback(
  input: PickInput,
  audience: Audience | null = null,
): PickResult {
  const pool =
    audience === null
      ? input.candidates
      : input.candidates.filter(
          (item) => item.audience === audience || item.audience === "unisex",
        );
  const candidates = pool.length > 0 ? pool : input.candidates;
  const requested = input.parsed.request.wants_count;
  const count =
    requested === 1 ? 1 : Math.min(MAX_ITEMS, candidates.length);
  const items = candidates.slice(0, count).map((item) => ({
    item,
    why: fallbackWhy(item, input.parsed),
    trade_off: fallbackTradeOff(item, input.parsed),
  }));

  return {
    message: fallbackMessage(input),
    items,
  };
}

async function pickOnce(
  input: PickInput,
  chat: ChatFn,
  candidates: readonly CatalogueItem[],
  timeoutMs: number,
): Promise<PickerOutput> {
  const result = await requestJson(
    {
      agent: "picker",
      system: PICKER_SYSTEM,
      user: pickerUser({
        message: input.message,
        language: input.parsed.language,
        parsed: input.parsed.request,
        relaxed: input.relaxed,
        candidates: candidates.map(toCandidate),
      }),
      schema: pickerOutputSchema,
      sessionId: input.sessionId,
      maxTokens: MAX_OUTPUT_TOKENS,
      timeoutMs,
      temperature: 0.2,
      reasoningEffort: "none",
    },
    chat,
  );
  return result.data;
}

function logPickError(event: string, error: LlmError): void {
  console.warn(
    JSON.stringify({
      event,
      kind: error.kind,
      status: error.status,
      message: error.message,
    }),
  );
}

export async function pickItems(
  input: PickInput,
  chat: ChatFn,
  options: PickOptions = {},
): Promise<PickResult> {
  if (input.candidates.length === 0) {
    return { message: "", items: [] };
  }

  const timeoutMs = options.timeoutMs ?? PICKER_TIMEOUT_MS;
  const retryTimeoutMs = options.retryTimeoutMs ?? PICKER_RETRY_TIMEOUT_MS;
  const deadline =
    options.deadline ?? Date.now() + timeoutMs + retryTimeoutMs;

  let output: PickerOutput;
  try {
    output = await pickOnce(input, chat, input.candidates, timeoutMs);
  } catch (error) {
    if (!(error instanceof LlmError)) throw error;
    logPickError("picker_error", error);

    const remaining = deadline - Date.now();
    const retryable =
      error.kind === "timeout" ||
      error.kind === "parse" ||
      (error.kind === "http" && (error.status ?? 0) >= 500);

    if (!retryable || remaining < 3_000) {
      logPickError("picker_fallback", error);
      return fallback(input);
    }

    const retryCandidates = input.candidates.slice(
      0,
      Math.min(6, input.candidates.length),
    );
    const retryBudget = Math.min(retryTimeoutMs, remaining - 2_000);
    console.warn(
      JSON.stringify({
        event: "picker_retry",
        kind: error.kind,
        candidates: retryCandidates.length,
        timeout_ms: retryBudget,
      }),
    );

    try {
      output = await pickOnce(input, chat, retryCandidates, retryBudget);
    } catch (retryError) {
      if (!(retryError instanceof LlmError)) throw retryError;
      logPickError("picker_fallback", retryError);
      return fallback(input);
    }
  }

  const byId = new Map(
    input.candidates.map((item) => [item.item_id, item] as const),
  );
  const seen = new Set<string>();
  const items: PickedItem[] = [];
  const dropped: string[] = [];

  for (const pick of output.items) {
    const item = byId.get(pick.item_id);
    if (!item || seen.has(item.item_id)) continue;
    seen.add(item.item_id);

    const why = trimWords(pick.why, 35);
    const tradeOff = trimWords(pick.trade_off, 25);
    if (why.length === 0 || tradeOff.length === 0) continue;

    const entry = { item, why, trade_off: tradeOff };
    const failure = groundingFailure(entry, input.parsed, input.message);
    if (failure !== null) {
      dropped.push(`${item.item_id}:${failure}`);
      continue;
    }

    items.push(entry);
    if (items.length >= MAX_ITEMS) break;
  }

  if (dropped.length > 0) {
    console.warn(
      JSON.stringify({ event: "picker_grounding_drop", dropped }),
    );
  }

  let selected = items;
  let audience: Audience | null = null;
  let audienceDropped = false;
  if (input.parsed.request.audience === null && items.length > 0) {
    audience = chooseAudience(items);
    if (audience !== null) {
      const kept = keepAudience(items, audience);
      if (kept.length !== items.length) {
        audienceDropped = true;
        console.warn(
          JSON.stringify({
            event: "picker_audience_drop",
            audience,
            dropped: items
              .filter((entry) => !kept.includes(entry))
              .map((entry) => entry.item.item_id),
          }),
        );
      }
      selected = kept;
    }
  }

  const minimum = input.parsed.request.wants_count === 1 ? 1 : 2;
  if (selected.length === 0) {
    console.warn(
      JSON.stringify({ event: "picker_partial_fallback", kept: 0, minimum }),
    );
    return fallback(input, audience);
  }

  if (selected.length < minimum && input.candidates.length >= minimum) {
    // Keep the grounded picks the model wrote and top up from the filter,
    // instead of throwing every model-written reason away.
    console.warn(
      JSON.stringify({
        event: "picker_top_up",
        kept: selected.length,
        minimum,
      }),
    );
    const taken = new Set(selected.map((entry) => entry.item.item_id));
    const extra = fallback(input, audience).items.filter(
      (entry) => !taken.has(entry.item.item_id),
    );
    const topped = [...selected, ...extra].slice(0, MAX_ITEMS);
    return {
      message: headlineFor(topped, input.parsed),
      items: topped,
    };
  }

  const rewriteHeadline = dropped.length > 0 || audienceDropped;

  return {
    message: rewriteHeadline
      ? headlineFor(selected, input.parsed)
      : ensureHeadline(trimWords(output.message, 25), selected, input.parsed),
    items: selected,
  };
}
