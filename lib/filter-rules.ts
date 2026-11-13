import type { CatalogueItem } from "./catalogue";
import { MAX_CANDIDATES } from "./config";
import type { ParsedNeed } from "./recommend-types";

export type RelaxedKey =
  | "sleeve"
  | "fit"
  | "pattern"
  | "formality"
  | "upkeep"
  | "use_tags"
  | "weather"
  | "colour";

export const RELAX_ORDER: readonly RelaxedKey[] = [
  "sleeve",
  "fit",
  "pattern",
  "formality",
  "upkeep",
  "use_tags",
  "weather",
  "colour",
];

const DARK_COLOURS = [
  "black",
  "navy",
  "dark",
  "charcoal",
  "maroon",
  "brown",
  "olive",
  "grey",
];

const LIGHT_COLOURS = [
  "white",
  "beige",
  "light",
  "peach",
  "lavender",
  "yellow",
  "pink",
];

export function colourHas(item: CatalogueItem, term: string): boolean {
  return item.colour.toLowerCase().includes(term.toLowerCase());
}

function toneHas(item: CatalogueItem, tones: readonly string[]): boolean {
  const colour = item.colour.toLowerCase();
  return tones.some((tone) => colour.includes(tone));
}

export function activeSoftKeys(need: ParsedNeed): Set<RelaxedKey> {
  const keys = new Set<RelaxedKey>();
  if (need.sleeve) keys.add("sleeve");
  if (need.fit_include.length > 0) keys.add("fit");
  if (need.pattern_include.length > 0) keys.add("pattern");
  if (need.formality_min !== null) keys.add("formality");
  if (need.upkeep !== null) keys.add("upkeep");
  if (need.use_tags.length > 0) keys.add("use_tags");
  if (need.weather !== null) keys.add("weather");
  if (need.colours_include.length > 0) keys.add("colour");
  return keys;
}

export function applySoft(
  items: readonly CatalogueItem[],
  need: ParsedNeed,
  applied: ReadonlySet<RelaxedKey>,
): CatalogueItem[] {
  return items.filter((item) => {
    if (
      applied.has("sleeve") &&
      need.sleeve &&
      !item.sleeve.toLowerCase().includes(need.sleeve)
    ) {
      return false;
    }
    if (
      applied.has("fit") &&
      need.fit_include.length > 0 &&
      !need.fit_include.some((fit) => item.fit.toLowerCase().includes(fit))
    ) {
      return false;
    }
    if (
      applied.has("pattern") &&
      need.pattern_include.length > 0 &&
      !need.pattern_include.some((pattern) =>
        item.pattern.toLowerCase().includes(pattern),
      )
    ) {
      return false;
    }
    if (
      applied.has("formality") &&
      need.formality_min !== null &&
      item.formality < need.formality_min
    ) {
      return false;
    }
    if (
      applied.has("upkeep") &&
      need.upkeep !== null &&
      item.upkeep !== need.upkeep
    ) {
      return false;
    }
    if (
      applied.has("use_tags") &&
      need.use_tags.length > 0 &&
      !need.use_tags.some((tag) => item.use_tags.includes(tag))
    ) {
      return false;
    }
    if (
      applied.has("weather") &&
      need.weather !== null &&
      item.weather !== need.weather
    ) {
      return false;
    }
    if (
      applied.has("colour") &&
      need.colours_include.length > 0 &&
      !need.colours_include.some((colour) => colourHas(item, colour))
    ) {
      return false;
    }
    return true;
  });
}

function score(item: CatalogueItem, need: ParsedNeed): number {
  let value = 0;

  for (const tag of need.use_tags) {
    if (item.use_tags.includes(tag)) value += 4;
  }

  if (
    need.colours_include.length > 0 &&
    need.colours_include.some((colour) => colourHas(item, colour))
  ) {
    value += 3;
  }

  if (need.colour_tone === "dark" && toneHas(item, DARK_COLOURS)) value += 3;
  if (need.colour_tone === "light" && toneHas(item, LIGHT_COLOURS)) value += 3;

  if (need.weather !== null && item.weather === need.weather) value += 2;

  if (need.formality_min !== null) {
    const difference = item.formality - need.formality_min;
    value += difference === 0 ? 1.5 : difference > 0 ? 0.5 : 0;
  }

  value += (item.rating ?? 0) * 0.5;

  if (need.sort === "cheapest") value -= item.price_inr / 200;
  if (need.sort === "best_rated") value += (item.rating ?? 0) * 2;

  if (need.sort === "balanced" && need.budget_max_inr !== null) {
    const ratio = item.price_inr / need.budget_max_inr;
    if (ratio >= 0.4 && ratio <= 0.8) value += 2;
  }

  return value;
}

export function diversify(
  items: readonly CatalogueItem[],
  need: ParsedNeed,
): CatalogueItem[] {
  const sorted = [...items].sort(
    (a, b) => score(b, need) - score(a, need) || a.price_inr - b.price_inr,
  );

  if (need.categories.length === 1) {
    return sorted.slice(0, MAX_CANDIDATES);
  }

  // No category named: show the picker a spread of categories, not six tees.
  const cap = need.categories.length === 0 ? 2 : 3;
  const counts = new Map<string, number>();
  const picked: CatalogueItem[] = [];

  for (const item of sorted) {
    const count = counts.get(item.category) ?? 0;
    if (count >= cap) continue;
    picked.push(item);
    counts.set(item.category, count + 1);
    if (picked.length >= MAX_CANDIDATES) break;
  }

  return picked;
}
