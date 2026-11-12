import { z } from "zod";

export const CATEGORIES = [
  "tee",
  "shirt",
  "hoodie",
  "sweatshirt",
  "jacket",
  "joggers",
  "jeans",
  "shorts",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const USE_TAGS = [
  "class",
  "hostel",
  "everyday",
  "fest",
  "travel",
  "gym",
  "outing",
  "presentation",
] as const;

export type UseTag = (typeof USE_TAGS)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  tee: "T-shirts",
  shirt: "Shirts",
  hoodie: "Hoodies",
  sweatshirt: "Sweatshirts",
  jacket: "Jackets",
  joggers: "Joggers",
  jeans: "Jeans",
  shorts: "Shorts",
};

export const CATEGORY_SINGULAR: Record<Category, string> = {
  tee: "t-shirt",
  shirt: "shirt",
  hoodie: "hoodie",
  sweatshirt: "sweatshirt",
  jacket: "jacket",
  joggers: "pair of joggers",
  jeans: "pair of jeans",
  shorts: "pair of shorts",
};

const catalogueItemSchema = z.object({
  item_id: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  audience: z.enum(["men", "women", "unisex"]),
  price_inr: z.number().int().positive(),
  mrp_inr: z.number().int().positive(),
  fabric: z.string(),
  gsm: z.number().nullable().optional(),
  fit: z.string(),
  colour: z.string(),
  pattern: z.string(),
  sleeve: z.string(),
  care: z.string(),
  sizes_available: z.array(z.string()).min(1),
  fit_note: z.string(),
  weather: z.enum(["hot_humid", "mild", "cold"]),
  formality: z.number().int().min(1).max(3),
  upkeep: z.enum(["easy", "hand_wash", "dry_clean"]),
  use_tags: z.array(z.enum(USE_TAGS)),
  source_url: z.string().url(),
  collected_on: z.string(),
  collected_by: z.string(),
  image_url: z.string().url(),
  rating: z.number().min(0).max(5).nullable().optional(),
  rating_count: z.number().int().nonnegative().nullable().optional(),
});

export type CatalogueItem = z.infer<typeof catalogueItemSchema>;

export function parseCatalogue(raw: unknown): CatalogueItem[] {
  return z.array(catalogueItemSchema).parse(raw);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(value: number): string {
  return inr.format(value);
}

export function discountPercent(item: CatalogueItem): number | null {
  if (item.mrp_inr <= item.price_inr) return null;
  return Math.round((1 - item.price_inr / item.mrp_inr) * 100);
}

export function itemHaystack(item: CatalogueItem): string {
  return [
    item.name,
    item.brand,
    item.category,
    CATEGORY_LABELS[item.category],
    item.audience,
    item.colour,
    item.fabric,
    item.pattern,
    item.fit,
    item.sleeve,
    item.use_tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

// Interleave categories so the first screen is a shop, not a wall of hoodies.
export function featuredOrder(items: CatalogueItem[]): CatalogueItem[] {
  const buckets = new Map<Category, CatalogueItem[]>(
    CATEGORIES.map((category) => [category, []]),
  );

  for (const item of items) {
    buckets.get(item.category)?.push(item);
  }

  const ordered: CatalogueItem[] = [];
  let remaining = items.length;
  while (remaining > 0) {
    for (const category of CATEGORIES) {
      const next = buckets.get(category)?.shift();
      if (!next) continue;
      ordered.push(next);
      remaining--;
    }
  }

  return ordered;
}
