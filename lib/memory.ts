import type {
  MissingField,
  ParsedNeed,
  ParsedRequest,
  PriorRequest,
} from "./recommend-types";

function missingFor(request: ParsedNeed): MissingField[] {
  const missing: MissingField[] = [];
  if (request.budget_max_inr === null) missing.push("budget");

  const hasCategorySignal =
    request.categories.length > 0 ||
    request.use_tags.length > 0 ||
    request.pattern_include.length > 0 ||
    request.fit_include.length > 0 ||
    request.colours_include.length > 0 ||
    request.weather !== null;

  if (!hasCategorySignal) missing.push("category");
  return missing;
}

function lowerBudget(value: number): number {
  return Math.max(300, Math.round((value * 0.8) / 50) * 50);
}

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function mergePrior(
  parsed: ParsedRequest,
  prior: PriorRequest | null,
  message: string,
): { parsed: ParsedRequest; used_prior: boolean } {
  if (prior === null) {
    return { parsed, used_prior: false };
  }

  const lower = message.toLowerCase();
  const cheaper = /\bcheaper\b|\bless\b|\bkam\b/.test(lower);
  const newNeed = parsed.request;
  const oldNeed = prior.request;

  const answersCategory =
    prior.missing.includes("category") && newNeed.categories.length > 0;
  const answersBudget =
    prior.missing.includes("budget") && newNeed.budget_max_inr !== null;
  const shouldMerge =
    parsed.references_prior || answersCategory || answersBudget;

  if (!shouldMerge) {
    return { parsed, used_prior: false };
  }

  const merged: ParsedNeed = { ...oldNeed };

  if (newNeed.budget_max_inr !== null) {
    merged.budget_max_inr = newNeed.budget_max_inr;
  }
  if (newNeed.audience !== null) merged.audience = newNeed.audience;
  if (newNeed.weather !== null) merged.weather = newNeed.weather;
  if (newNeed.formality_min !== null) {
    merged.formality_min = newNeed.formality_min;
  }
  if (newNeed.upkeep !== null) merged.upkeep = newNeed.upkeep;
  if (newNeed.sleeve !== null) merged.sleeve = newNeed.sleeve;
  if (newNeed.sort !== "balanced") merged.sort = newNeed.sort;
  if (newNeed.wants_count !== null) merged.wants_count = newNeed.wants_count;
  if (newNeed.brand_other !== null) merged.brand_other = newNeed.brand_other;
  if (newNeed.colour_tone !== null) merged.colour_tone = newNeed.colour_tone;

  if (newNeed.categories.length > 0) {
    merged.categories = newNeed.categories;
  }
  if (newNeed.fabric_include.length > 0) {
    merged.fabric_include = newNeed.fabric_include;
  }
  if (newNeed.fit_include.length > 0) {
    merged.fit_include = newNeed.fit_include;
  }
  if (newNeed.pattern_include.length > 0) {
    merged.pattern_include = newNeed.pattern_include;
  }
  if (newNeed.colours_include.length > 0) {
    merged.colours_include = newNeed.colours_include;
  }
  if (newNeed.colours_exclude.length > 0) {
    merged.colours_exclude = unique([
      ...oldNeed.colours_exclude,
      ...newNeed.colours_exclude,
    ]);
  }
  if (newNeed.use_tags.length > 0) {
    merged.use_tags = unique([...oldNeed.use_tags, ...newNeed.use_tags]);
  }

  for (const colour of newNeed.colours_exclude) {
    merged.colours_include = merged.colours_include.filter(
      (value) => value !== colour,
    );
  }
  for (const colour of newNeed.colours_include) {
    merged.colours_exclude = merged.colours_exclude.filter(
      (value) => value !== colour,
    );
  }

  if (
    cheaper &&
    newNeed.budget_max_inr === null &&
    merged.budget_max_inr !== null
  ) {
    merged.budget_max_inr = lowerBudget(merged.budget_max_inr);
  }

  const missing = missingFor(merged);
  const intent = missing.length > 0 ? "clarify" : "recommend";

  return {
    parsed: {
      ...parsed,
      intent,
      missing,
      references_prior: false,
      decline_reason: null,
      request: merged,
    },
    used_prior: true,
  };
}
