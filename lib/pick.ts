import { CATEGORY_LABELS, formatINR, type CatalogueItem } from "./catalogue";
import { MAX_ITEMS } from "./config";
import { LlmError, requestJson, type ChatFn } from "./llm";
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

function trimWords(value: string, max: number): string {
  const clean = value.trim().replace(/\s+/g, " ");
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
    sleeve: item.sleeve,
    weather: item.weather,
    formality: item.formality,
    upkeep: item.upkeep,
    care: item.care,
    use_tags: item.use_tags,
    fit_note: item.fit_note.slice(0, 120),
  };
}

function fallbackWhy(item: CatalogueItem, parsed: ParsedRequest): string {
  const label = CATEGORY_LABELS[item.category].toLowerCase();
  const price = formatINR(item.price_inr);
  const budget = parsed.request.budget_max_inr;
  const details = [
    ...parsed.request.fabric_include,
    ...(parsed.request.pattern_include.includes("solid") ? ["plain"] : []),
    ...(parsed.request.weather === "hot_humid" ? ["hot weather"] : []),
    ...(parsed.request.weather === "cold" ? ["cold weather"] : []),
    ...parsed.request.use_tags.slice(0, 1),
  ];

  if (parsed.language === "hinglish") {
    const suffix = details.length > 0 ? `, ${details.join(", ")}` : "";
    return budget === null
      ? `${item.colour.toLowerCase()} ${label}, ${price} mein${suffix}.`
      : `${item.colour.toLowerCase()} ${label}, ${price} mein — ${formatINR(budget)} ke andar${suffix}.`;
  }

  const suffix = details.length > 0 ? `, good for ${details.join(", ")}` : "";
  return budget === null
    ? `${item.fit.toLowerCase()} ${item.colour.toLowerCase()} ${label} at ${price}${suffix}.`
    : `${item.fit.toLowerCase()} ${item.colour.toLowerCase()} ${label} at ${price}${suffix} — inside your ${formatINR(budget)} budget.`;
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

  if (item.rating === null || item.rating === undefined) {
    return hinglish
      ? "Abhi rating nahi hai — size chart check kar lena."
      : "No rating yet — check the size chart.";
  }

  return hinglish
    ? "Order se pehle size chart check kar lena."
    : "Check the size chart before ordering.";
}

function fallback(input: PickInput): PickResult {
  const count = input.parsed.request.wants_count === 1 ? 1 : 2;
  const items = input.candidates.slice(0, count).map((item) => ({
    item,
    why: fallbackWhy(item, input.parsed),
    trade_off: fallbackTradeOff(item, input.parsed),
  }));

  return {
    message:
      input.parsed.language === "hinglish"
        ? "Yeh pieces budget aur request mein fit hain."
        : "These pieces fit the budget and the request.",
    items,
  };
}

export async function pickItems(
  input: PickInput,
  chat: ChatFn,
): Promise<PickResult> {
  if (input.candidates.length === 0) {
    return { message: "", items: [] };
  }

  let output: PickerOutput;
  try {
    const result = await requestJson(
      {
        agent: "picker",
        system: PICKER_SYSTEM,
        user: pickerUser({
          message: input.message,
          language: input.parsed.language,
          parsed: input.parsed.request,
          relaxed: input.relaxed,
          candidates: input.candidates.map(toCandidate),
        }),
        schema: pickerOutputSchema,
        sessionId: input.sessionId,
        maxTokens: 3_000,
        timeoutMs: 35_000,
        temperature: 0.2,
      },
      chat,
    );
    output = result.data;
  } catch (error) {
    if (error instanceof LlmError) {
      console.warn(
        JSON.stringify({
          event: "picker_fallback",
          kind: error.kind,
          status: error.status,
          message: error.message,
        }),
      );
      return fallback(input);
    }
    throw error;
  }

  const byId = new Map(
    input.candidates.map((item) => [item.item_id, item] as const),
  );
  const seen = new Set<string>();
  const items: PickedItem[] = [];

  for (const pick of output.items) {
    const item = byId.get(pick.item_id);
    if (!item || seen.has(item.item_id)) continue;
    seen.add(item.item_id);

    const why = trimWords(pick.why, 40);
    const tradeOff = trimWords(pick.trade_off, 25);
    if (why.length === 0 || tradeOff.length === 0) continue;

    items.push({ item, why, trade_off: tradeOff });
    if (items.length >= MAX_ITEMS) break;
  }

  if (items.length === 0) {
    return fallback(input);
  }

  return {
    message: trimWords(output.message, 25),
    items,
  };
}
