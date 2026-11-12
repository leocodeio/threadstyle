import {
  CATEGORY_LABELS,
  formatINR,
  itemHaystack,
  type CatalogueItem,
  type Category,
} from "./catalogue";
import type { ParsedRequest } from "./recommend-types";

export type GroundedEntry = {
  readonly item: CatalogueItem;
  readonly why: string;
  readonly trade_off: string;
};

const OCCASIONS = [
  "class",
  "hostel",
  "fest",
  "travel",
  "gym",
  "outing",
  "presentation",
  "college",
  "office",
  "party",
  "interview",
] as const;

const BANNED_CLAIMS = [
  "premium",
  "best quality",
  "high quality",
  "waterproof",
  "wrinkle-free",
  "wrinkle free",
  "sweat-proof",
  "sweatproof",
  "branded",
  "durable",
] as const;

const CATEGORY_WORDS: Record<Category, readonly string[]> = {
  tee: ["tee", "tees", "t-shirt", "t-shirts", "tshirt", "tshirts"],
  shirt: ["shirt", "shirts"],
  hoodie: ["hoodie", "hoodies"],
  sweatshirt: ["sweatshirt", "sweatshirts", "sweater", "sweaters"],
  jacket: ["jacket", "jackets"],
  joggers: ["jogger", "joggers", "track pant", "track pants"],
  jeans: ["jeans", "denim"],
  shorts: ["shorts"],
};

function allowedOccasions(
  parsed: ParsedRequest,
  message: string,
): ReadonlySet<string> {
  const allowed = new Set<string>(parsed.request.use_tags);
  const lower = message.toLowerCase();
  for (const word of OCCASIONS) {
    if (lower.includes(word)) allowed.add(word);
  }
  if (lower.includes("college")) allowed.add("class");
  return allowed;
}

export function groundingFailure(
  entry: GroundedEntry,
  parsed: ParsedRequest,
  message: string,
): string | null {
  const text = `${entry.why} ${entry.trade_off}`.toLowerCase();
  const allowed = allowedOccasions(parsed, message);

  for (const word of OCCASIONS) {
    if (text.includes(word) && !allowed.has(word)) {
      return `occasion:${word}`;
    }
  }

  const haystack = itemHaystack(entry.item);
  for (const claim of BANNED_CLAIMS) {
    if (text.includes(claim) && !haystack.includes(claim)) {
      return `claim:${claim}`;
    }
  }

  const care = entry.item.care.toLowerCase();
  const claimsNoIron = /no[ -]?iron|low[ -]?iron/.test(text);
  const claimsIron = /need(s)? (a quick )?iron|quick iron|iron after|needs ironing/.test(
    text,
  );
  const claimsEasyWash = /easy (machine )?wash/.test(text);

  if (claimsNoIron && !care.includes("low iron") && !care.includes("no iron")) {
    return "care:no-iron";
  }
  if (claimsNoIron && claimsIron) return "care:contradiction";
  if (claimsEasyWash && care.includes("gentle")) return "care:gentle";
  if (claimsEasyWash && claimsIron) return "care:contradiction";

  if (
    (text.includes("wrinkle-free") || text.includes("wrinkle free")) &&
    !haystack.includes("wrinkle")
  ) {
    return "claim:wrinkle-free";
  }

  return null;
}

export function messageFailure(
  message: string,
  items: readonly GroundedEntry[],
): string | null {
  const lower = message.toLowerCase();
  const categories = new Set(items.map((entry) => entry.item.category));

  for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
    if (
      words.some((word) => lower.includes(word)) &&
      !categories.has(category as Category)
    ) {
      return `category:${category}`;
    }
  }

  if (lower.includes("outfit")) return "outfit";

  for (const claim of BANNED_CLAIMS) {
    if (lower.includes(claim)) return `claim:${claim}`;
  }

  if (/no[ -]?iron|low[ -]?iron/.test(lower)) {
    const supported = items.some((entry) =>
      /low iron|no iron/.test(entry.item.care.toLowerCase()),
    );
    if (!supported) return "care:no-iron";
  }

  if (/wrinkle[ -]?free/.test(lower)) {
    const supported = items.some((entry) =>
      entry.item.care.toLowerCase().includes("wrinkle"),
    );
    if (!supported) return "claim:wrinkle-free";
  }

  const counts: Readonly<Record<string, number>> = { two: 2, three: 3 };
  for (const [word, count] of Object.entries(counts)) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && items.length !== count) {
      return `count:${word}`;
    }
  }

  return null;
}

export function ensureHeadline(
  message: string,
  items: readonly GroundedEntry[],
  parsed: ParsedRequest,
): string {
  if (items.length === 0 || messageFailure(message, items) === null) {
    return message;
  }
  return headlineFor(items, parsed);
}

export function headlineFor(
  items: readonly GroundedEntry[],
  parsed: ParsedRequest,
): string {
  const labels = [
    ...new Set(
      items.map((entry) => CATEGORY_LABELS[entry.item.category].toLowerCase()),
    ),
  ];
  const budget = parsed.request.budget_max_inr;
  const joined =
    parsed.language === "hinglish" ? labels.join(" aur ") : labels.join(" and ");

  const headline =
    parsed.language === "hinglish"
      ? budget === null
        ? `${joined} — request ke hisaab se.`
        : `${joined} — ${formatINR(budget)} ke andar.`
      : budget === null
        ? `${joined} picked for your request.`
        : `${joined} inside ${formatINR(budget)}.`;

  return headline.charAt(0).toUpperCase() + headline.slice(1);
}
