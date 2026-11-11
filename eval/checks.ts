import { catalogueById } from "../lib/catalogue-data";
import type { CatalogueItem } from "../lib/catalogue";
import type { RecommendResponse } from "../lib/recommend-types";

export type GoldenRow = {
  readonly id: string;
  readonly type: string;
  readonly input: string;
  readonly expected_behavior: string;
  readonly max_price_inr: string;
  readonly categories_any: string;
  readonly required_top_pick_tags: string;
  readonly min_items: string;
  readonly must_not: string;
  readonly judge_check: string;
};

export type Check = {
  readonly ok: boolean;
  readonly failures: readonly string[];
};

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function topPickTagMatches(item: CatalogueItem, expression: string): boolean {
  const separator = expression.includes("~") ? "~" : "=";
  const [key = "", value = ""] = expression.split(separator);
  if (key === "" || value === "") return false;

  switch (key) {
    case "weather":
      return item.weather === value;
    case "pattern":
      return item.pattern.toLowerCase() === value.toLowerCase();
    case "formality":
      return String(item.formality) === value;
    case "upkeep":
      return item.upkeep === value;
    case "colour":
      return item.colour.toLowerCase().includes(value.toLowerCase());
    case "fit":
      return item.fit.toLowerCase().includes(value.toLowerCase());
    case "use_tags":
      return item.use_tags.some((tag) => tag === value);
    default:
      return false;
  }
}

export function checkDeterministic(
  row: GoldenRow,
  result: RecommendResponse,
): Check {
  const failures: string[] = [];
  const expected = row.expected_behavior.trim();
  const items = result.items;
  const minItems = numberOrNull(row.min_items) ?? 1;
  const maxPrice = numberOrNull(row.max_price_inr);
  const categories = row.categories_any
    .split("|")
    .map((value) => value.trim())
    .filter((value) => value !== "" && value !== "any");

  if (expected === "recommend") {
    if (result.state !== "recommend") {
      failures.push(`state ${result.state}, expected recommend`);
    }
    if (items.length < minItems) {
      failures.push(`${items.length} items, expected at least ${minItems}`);
    }
    if (items.length > 3) {
      failures.push(`${items.length} items, max 3`);
    }
    if (maxPrice !== null) {
      for (const entry of items) {
        if (entry.item.price_inr > maxPrice) {
          failures.push(
            `${entry.item.item_id} is ₹${entry.item.price_inr}, above ₹${maxPrice}`,
          );
        }
      }
    }
    if (categories.length > 0) {
      for (const entry of items) {
        if (!categories.includes(entry.item.category)) {
          failures.push(
            `${entry.item.item_id} is ${entry.item.category}, not ${categories.join("|")}`,
          );
        }
      }
    }
    const topPick = items[0];
    if (topPick) {
      for (const expression of row.required_top_pick_tags
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean)) {
        if (!topPickTagMatches(topPick.item, expression)) {
          failures.push(`top pick fails ${expression}`);
        }
      }
    }
  } else {
    if (result.state !== expected) {
      failures.push(`state ${result.state}, expected ${expected}`);
    }
    if (items.length > 0) {
      failures.push(`showed ${items.length} items, expected none`);
    }
  }

  for (const entry of items) {
    if (!catalogueById.has(entry.item.item_id)) {
      failures.push(`invented item ${entry.item.item_id}`);
    }
  }

  return { ok: failures.length === 0, failures };
}
