import type { CatalogueItem } from "@/lib/catalogue";
import type { ChatFn } from "@/lib/llm";
import type {
  ParsedNeed,
  ParsedRequest,
} from "@/lib/recommend-types";

type ItemOverrides = Partial<CatalogueItem> &
  Pick<CatalogueItem, "item_id" | "category" | "price_inr">;

export function makeItem(overrides: ItemOverrides): CatalogueItem {
  const base: CatalogueItem = {
    item_id: overrides.item_id,
    brand: "Bewakoof",
    name: overrides.item_id,
    category: overrides.category,
    audience: "men",
    price_inr: overrides.price_inr,
    mrp_inr: overrides.price_inr + 500,
    fabric: "100% Cotton",
    gsm: null,
    fit: "Regular Fit",
    colour: "Black",
    pattern: "solid",
    sleeve: "half",
    care: "Machine wash as per tag",
    sizes_available: ["M", "L"],
    fit_note: "",
    weather: "hot_humid",
    formality: 1,
    upkeep: "easy",
    use_tags: ["class"],
    source_url: "https://www.bewakoof.com/p/test",
    collected_on: "2026-11-11",
    collected_by: "agent",
    image_url: "https://images.bewakoof.com/test.jpg",
    rating: 4.5,
    rating_count: 10,
  };

  return { ...base, ...overrides };
}

export function makeNeed(overrides: Partial<ParsedNeed> = {}): ParsedNeed {
  return {
    categories: [],
    budget_max_inr: 2_000,
    audience: null,
    colours_include: [],
    colours_exclude: [],
    colour_tone: null,
    fabric_include: [],
    brand_other: null,
    weather: null,
    formality_min: null,
    upkeep: null,
    fit_include: [],
    pattern_include: [],
    use_tags: [],
    sleeve: null,
    sort: "balanced",
    wants_count: null,
    ...overrides,
  };
}

type ParserOverrides = {
  readonly intent?: ParsedRequest["intent"];
  readonly language?: ParsedRequest["language"];
  readonly references_prior?: boolean;
  readonly missing?: ParsedRequest["missing"];
  readonly decline_reason?: ParsedRequest["decline_reason"];
  readonly request?: Partial<ParsedNeed>;
};

export function makeParser(overrides: ParserOverrides = {}): ParsedRequest {
  return {
    intent: overrides.intent ?? "recommend",
    language: overrides.language ?? "en",
    references_prior: overrides.references_prior ?? false,
    missing: overrides.missing ?? [],
    decline_reason: overrides.decline_reason ?? null,
    request: makeNeed(overrides.request),
  };
}

export function chatSequence(responses: readonly unknown[]): ChatFn {
  let index = 0;
  return async () => {
    const response = responses[index];
    index += 1;
    if (response === undefined) {
      throw new Error("No fake chat response left");
    }
    return {
      text: JSON.stringify(response),
      usage: null,
      latencyMs: 1,
    };
  };
}
