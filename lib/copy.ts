import { CATEGORY_LABELS, formatINR } from "./catalogue";
import type { FilterResult } from "./filter";
import type {
  DeclineReason,
  Language,
  MissingField,
  ParsedNeed,
} from "./recommend-types";

function categoryPhrase(need: ParsedNeed): string {
  if (need.categories.length === 0) return "pieces";
  if (need.categories.length === 1) {
    const category = need.categories[0];
    return category ? CATEGORY_LABELS[category].toLowerCase() : "pieces";
  }
  return need.categories
    .slice(0, 3)
    .map((category) => CATEGORY_LABELS[category].toLowerCase())
    .join(" or ");
}

function budgetLimit(need: ParsedNeed): string {
  return need.budget_max_inr === null
    ? "that budget"
    : formatINR(need.budget_max_inr);
}

function minimum(result: FilterResult): string | null {
  return result.minPrice === null ? null : formatINR(result.minPrice);
}

export function clarifyMessage(
  missing: readonly MissingField[],
  referencesPrior: boolean,
  language: Language,
): string {
  const hinglish = language === "hinglish";

  if (referencesPrior) {
    return hinglish
      ? "Is session mein pehle koi request nahi hai. Kya chahiye, aur budget kitna hai?"
      : "I don't have an earlier request in this session. What are you looking for, and what's your budget?";
  }

  const needsCategory = missing.includes("category");
  const needsBudget = missing.includes("budget");

  if (needsCategory && needsBudget) {
    return hinglish
      ? "Kya chahiye, aur budget kitna hai?"
      : "What are you looking for, and what's your budget?";
  }

  if (needsCategory) {
    return hinglish
      ? "Kis type ka piece — tee, shirt, hoodie, ya kuch aur?"
      : "What kind of piece — a tee, shirt, hoodie, or something else?";
  }

  return hinglish ? "Budget kitna hai?" : "What's your budget?";
}

export function declineMessage(
  reason: DeclineReason,
  language: Language,
): string {
  const hinglish = language === "hinglish";

  switch (reason) {
    case "body":
      return hinglish
        ? "Main body shape ya skin tone ke hisaab se judge nahi kar sakta. Fabric, cut, colour, ya budget se help kar sakta hoon."
        : "I can't judge how a piece will look on your body. I can help with fabric, cut, colour, or budget instead.";
    case "size":
      return hinglish
        ? "Height aur weight se fit predict nahi kar sakta. Har product page pe Bewakoof ka size chart sabse reliable check hai."
        : "I can't predict fit from height and weight. The Bewakoof size chart on each product page is the reliable check.";
    case "order":
      return hinglish
        ? "Main order place ya payment nahi kar sakta. Piece pick karke Bewakoof link de sakta hoon."
        : "I can't place orders or handle payment. I can help you pick a piece and link you to Bewakoof.";
    case "rules":
      return hinglish
        ? "Main catalogue rules ignore nahi kar sakta, lekin aapke budget mein ek achha piece dhoondh sakta hoon."
        : "I can't ignore the catalogue rules, but I can find a good piece within a budget you set.";
  }
}

export function noMatchMessage(
  result: FilterResult,
  need: ParsedNeed,
  language: Language,
): string {
  const hinglish = language === "hinglish";
  const category = categoryPhrase(need);
  const budget = budgetLimit(need);
  const cheapest = minimum(result);

  if (result.reason === "other_store") {
    const brand = need.brand_other ?? "that store";
    return hinglish
      ? `Main sirf Bewakoof cover karta hoon, ${brand} nahi. Bewakoof ke ${category} dikha sakta hoon.`
      : `I only cover Bewakoof, so I can't quote ${brand}. I can show you ${category} from Bewakoof instead.`;
  }

  if (result.reason === "fabric") {
    const fabric = need.fabric_include.join(" ");
    if (cheapest !== null && need.budget_max_inr !== null) {
      return hinglish
        ? `Catalogue mein ${fabric} ${category} nahi hai. ${budget} ke andar bhi kuch nahi; sabse sasta ${cheapest} ka hai.`
        : `No ${fabric} ${category} in the catalogue. Nothing under ${budget} either; the cheapest is ${cheapest}.`;
    }
    return hinglish
      ? `Catalogue mein ${fabric} ${category} nahi hai.`
      : `No ${fabric} ${category} in the catalogue.`;
  }

  if (result.reason === "budget") {
    if (cheapest !== null) {
      return hinglish
        ? `${budget} ke andar koi ${category} nahi hai. Sabse sasta ${cheapest} ka hai.`
        : `Nothing in ${category} is under ${budget}. The cheapest is ${cheapest}.`;
    }
    return hinglish
      ? `${budget} ke andar koi ${category} nahi hai.`
      : `Nothing in ${category} fits ${budget}.`;
  }

  return hinglish
    ? "Is combination mein kuch nahi mila. Thoda simple try karo."
    : "Nothing matches that combination. Try fewer constraints.";
}

export function otherStoreMessage(
  need: ParsedNeed,
  missing: readonly MissingField[],
  language: Language,
): string {
  const hinglish = language === "hinglish";
  const brand = need.brand_other ?? "that store";
  const category = categoryPhrase(need);

  if (missing.length === 0) {
    const budget = budgetLimit(need);
    return hinglish
      ? `Main sirf Bewakoof cover karta hoon, ${brand} nahi. Bewakoof ke ${category} ${budget} ke andar dekhne hain? "haan" bol do.`
      : `I only cover Bewakoof, so I can't quote ${brand}. Want Bewakoof ${category} under ${budget} instead? Say "yes".`;
  }

  const ask = missing.includes("budget")
    ? hinglish
      ? "Budget bata do"
      : "Tell me your budget"
    : hinglish
      ? "Bata do kya chahiye"
      : "Tell me what you need";

  return hinglish
    ? `Main sirf Bewakoof cover karta hoon, ${brand} nahi. ${ask}, Bewakoof ke ${category} dikhaunga.`
    : `I only cover Bewakoof, so I can't quote ${brand}. ${ask} and I'll show Bewakoof ${category}.`;
}

export function audienceNote(
  shown: "men" | "women",
  language: Language,
): string {
  const other = shown === "men" ? "women's" : "men's";
  const label = shown === "men" ? "men's" : "women's";
  return language === "hinglish"
    ? `Abhi ${label} pieces dikha raha hoon — ${other} chahiye to bol do.`
    : `Showing ${label} pieces — say "${other}" to switch.`;
}
