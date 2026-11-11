import type { CatalogueItem } from "./catalogue";
import {
  activeSoftKeys,
  applySoft,
  colourHas,
  diversify,
  RELAX_ORDER,
  type RelaxedKey,
} from "./filter-rules";
import type { ParsedNeed } from "./recommend-types";

export type FilterReason =
  | "ok"
  | "other_store"
  | "fabric"
  | "budget"
  | "empty";

export type FilterResult = {
  readonly candidates: readonly CatalogueItem[];
  readonly total: number;
  readonly relaxed: readonly RelaxedKey[];
  readonly reason: FilterReason;
  readonly minPrice: number | null;
};

export function filterCatalogue(
  items: readonly CatalogueItem[],
  need: ParsedNeed,
): FilterResult {
  const base = items.filter((item) => {
    if (
      need.categories.length > 0 &&
      !need.categories.includes(item.category)
    ) {
      return false;
    }
    if (
      need.audience !== null &&
      item.audience !== need.audience &&
      item.audience !== "unisex"
    ) {
      return false;
    }
    if (
      need.colours_exclude.length > 0 &&
      need.colours_exclude.some((colour) => colourHas(item, colour))
    ) {
      return false;
    }
    return true;
  });

  const minPrice =
    base.length > 0
      ? Math.min(...base.map((item) => item.price_inr))
      : null;

  if (base.length === 0) {
    return {
      candidates: [],
      total: 0,
      relaxed: [],
      reason: "empty",
      minPrice,
    };
  }

  if (need.brand_other !== null) {
    const brand = need.brand_other.toLowerCase();
    if (!brand.includes("bewakoof")) {
      return {
        candidates: [],
        total: 0,
        relaxed: [],
        reason: "other_store",
        minPrice,
      };
    }
  }

  const fabricBase =
    need.fabric_include.length > 0
      ? base.filter((item) =>
          need.fabric_include.every((fabric) =>
            item.fabric.toLowerCase().includes(fabric),
          ),
        )
      : base;

  if (fabricBase.length === 0) {
    return {
      candidates: [],
      total: 0,
      relaxed: [],
      reason: "fabric",
      minPrice,
    };
  }

  const budget = need.budget_max_inr;
  const budgetBase =
    budget !== null
      ? fabricBase.filter((item) => item.price_inr <= budget)
      : fabricBase;

  if (budgetBase.length === 0) {
    return {
      candidates: [],
      total: 0,
      relaxed: [],
      reason: "budget",
      minPrice,
    };
  }

  const softKeys = activeSoftKeys(need);
  const applied = new Set<RelaxedKey>(softKeys);
  const relaxed: RelaxedKey[] = [];
  let filtered = applySoft(budgetBase, need, applied);

  if (filtered.length === 0) {
    for (const key of RELAX_ORDER) {
      if (!applied.has(key)) continue;
      applied.delete(key);
      relaxed.push(key);
      filtered = applySoft(budgetBase, need, applied);
      if (filtered.length > 0) break;
    }
  }

  if (filtered.length === 0) {
    filtered = [...budgetBase];
    for (const key of softKeys) {
      if (!relaxed.includes(key)) relaxed.push(key);
    }
  }

  return {
    candidates: diversify(filtered, need),
    total: filtered.length,
    relaxed,
    reason: "ok",
    minPrice,
  };
}
