#!/usr/bin/env node
// Build data/catalogue.csv from scraped Bewakoof product JSONL.
// Usage: node scripts/build-catalogue.mjs
//
// Rules:
// - real products only; every row traces to a source_url and product id
// - in stock, at least one enabled size, valid price
// - one row per Bewakoof product id
// - category quotas keep the catalogue balanced and price-diverse
// - fields Bewakoof does not publish (e.g. gsm) stay blank

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data/raw/scraped");
const OUT = path.join(ROOT, "data/catalogue.csv");
const TODAY = "2026-11-11";

const CATEGORY_QUOTAS = {
  men: {
    tee: 80,
    shirt: 28,
    hoodie: 27,
    sweatshirt: 18,
    jacket: 18,
    joggers: 25,
    jeans: 22,
    shorts: 22,
  },
  women: {
    tee: 22,
    shirt: 8,
    hoodie: 6,
    sweatshirt: 6,
    jacket: 6,
    joggers: 5,
    jeans: 4,
    shorts: 3,
  },
};

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const stripHtml = (value) =>
  clean(String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " "));

function categoryOf(product) {
  const info = product.category_info ?? {};
  const attrs = product.product_attributes ?? {};
  const name = clean(product.name).toLowerCase();
  const hay = `${info.subclass ?? ""} ${info.category_name ?? ""} ${attrs.type ?? ""}`.toLowerCase();

  // Product titles are more literal than the store's taxonomy, which mixes
  // hoodies into sweatshirts and tees into tops. Trust the title first.
  if (/sweatshirt|sweater/.test(name)) return "sweatshirt";
  if (/hoodie|hooded/.test(name)) return "hoodie";
  if (/t[- ]?shirt|tee\b|polo/.test(name)) return "tee";
  if (/jogger/.test(name)) return "joggers";
  if (/jean|denim/.test(name)) return "jeans";
  if (/short/.test(name)) return "shorts";
  if (/jacket|windcheater|wind cheater|shacket/.test(name)) return "jacket";
  if (/shirt/.test(name)) return "shirt";

  if (/sweatshirt|sweater/.test(hay)) return "sweatshirt";
  if (/t[- ]?shirt|tee|polo/.test(hay)) return "tee";
  if (/hood/.test(hay)) return "hoodie";
  if (/jacket|windcheater|wind cheater|shacket/.test(hay)) return "jacket";
  if (/jogger/.test(hay)) return "joggers";
  if (/jean|denim/.test(hay)) return "jeans";
  if (/short/.test(hay)) return "shorts";
  if (/shirt/.test(hay)) return "shirt";
  return null;
}

function audienceOf(product) {
  const gender = clean(product.gender).toLowerCase();
  if (gender.startsWith("women") || gender.startsWith("woman")) return "women";
  if (gender.startsWith("men") || gender.startsWith("man")) return "men";
  return "unisex";
}

const COLOUR_WORDS = [
  "jet black",
  "off white",
  "navy blue",
  "royal blue",
  "sky blue",
  "light blue",
  "dark blue",
  "olive green",
  "bottle green",
  "sea green",
  "light grey",
  "dark grey",
  "charcoal grey",
  "coral pink",
  "hot pink",
  "baby pink",
  "dark brown",
  "light brown",
  "ginger root brown",
  "black",
  "white",
  "navy",
  "blue",
  "green",
  "olive",
  "red",
  "maroon",
  "pink",
  "purple",
  "lavender",
  "lilac",
  "brown",
  "beige",
  "cream",
  "grey",
  "gray",
  "charcoal",
  "yellow",
  "mustard",
  "orange",
  "peach",
  "teal",
  "turquoise",
  "khaki",
  "wine",
  "burgundy",
  "rust",
  "coral",
  "mint",
].sort((a, b) => b.length - a.length);

function colourOf(product) {
  const attrs = product.product_attributes ?? {};
  const name = clean(product.name).toLowerCase();
  const fromName = COLOUR_WORDS.find((colour) =>
    new RegExp(`(^|[^a-z])${colour}([^a-z]|$)`).test(name),
  );
  if (fromName) {
    return fromName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const raw = clean(attrs.color || product.color?.name || product.color?.parent_color_name);
  const first = raw.split(/[/,|-]/)[0].replace(/\s+\d+$/, "").trim();
  if (!first) return "unknown";
  return first
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function patternOf(product) {
  const design = clean(product.product_attributes?.design).toLowerCase();
  if (!design) return "solid";
  if (design.includes("solid") || design.includes("plain")) return "solid";
  if (design.includes("typograph")) return "typography";
  if (design.includes("graphic")) return "graphic";
  if (design.includes("check")) return "checked";
  if (design.includes("strip")) return "striped";
  if (design.includes("color") || design.includes("colour")) return "colorblock";
  if (design.includes("embroider")) return "embroidered";
  if (design.includes("print")) return "printed";
  if (design.includes("textur")) return "textured";
  if (design.includes("wash")) return "washed";
  return design.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "solid";
}

function sleeveOf(product, category) {
  const name = clean(product.name).toLowerCase();
  if (name.includes("sleeveless") || name.includes("no sleeve")) return "sleeveless";
  if (name.includes("full sleeve") || name.includes("full-sleeve")) return "full";
  if (name.includes("half sleeve") || name.includes("half-sleeve")) return "half";

  const sleeve = clean(
    product.product_attributes?.sleeve_style || product.product_attributes?.sleeve,
  ).toLowerCase();
  if (sleeve.includes("sleeveless") || sleeve.includes("no sleeve")) return "sleeveless";
  if (sleeve.includes("full")) return "full";
  if (sleeve.includes("3/4") || sleeve.includes("three quarter")) return "three_quarter";
  if (sleeve.includes("half") || sleeve.includes("short")) return "half";
  if (sleeve) return sleeve.replace(/\s+/g, "_");

  // Bewakoof leaves sleeve blank on many tops; use the category default.
  if (category === "tee") return "half";
  if (category === "shirt") return "full";
  if (category === "hoodie" || category === "sweatshirt" || category === "jacket") return "full";
  return "";
}

function weatherOf(category, sleeve) {
  if (["hoodie", "sweatshirt", "jacket"].includes(category)) return "cold";
  if (["jeans", "joggers"].includes(category)) return "mild";
  if (["tee", "shirt", "shorts"].includes(category)) {
    return sleeve === "full" && category !== "shorts" ? "mild" : "hot_humid";
  }
  return "mild";
}

function formalityOf(product, category) {
  const name = clean(product.name).toLowerCase();
  if (category === "shirt") return 2;
  if (category === "jacket") return 2;
  if (category === "tee" && /polo|henley|oxford/.test(name)) return 2;
  return 1;
}

function upkeepOf(care) {
  const value = care.toLowerCase();
  if (value.includes("dry clean")) return "dry_clean";
  if (value.includes("hand wash")) return "hand_wash";
  return "easy";
}

function tagsOf(product, category, pattern) {
  const name = clean(product.name).toLowerCase();
  const tags = new Set();

  if (category === "tee") {
    tags.add("class");
    tags.add("hostel");
    tags.add("everyday");
    if (/graphic|printed|typography/.test(pattern)) tags.add("fest");
    if (/gym|training|active|sport/.test(name)) tags.add("gym");
  } else if (category === "shirt") {
    tags.add("class");
    tags.add("presentation");
    if (/graphic|printed|checked|striped/.test(pattern)) tags.add("fest");
  } else if (category === "hoodie" || category === "sweatshirt") {
    tags.add("class");
    tags.add("travel");
    tags.add("hostel");
  } else if (category === "jacket") {
    tags.add("class");
    tags.add("travel");
    tags.add("outing");
  } else if (category === "joggers") {
    tags.add("class");
    tags.add("gym");
    tags.add("hostel");
  } else if (category === "jeans") {
    tags.add("class");
    tags.add("outing");
    tags.add("everyday");
  } else if (category === "shorts") {
    tags.add("hostel");
    tags.add("gym");
    tags.add("everyday");
  }

  return [...tags].join("|");
}

function fitNoteOf(product) {
  const detail = product.description?.[0]?.specifications?.description_details?.[0];
  const note = stripHtml(detail);
  return note.length > 110 ? `${note.slice(0, 107).trimEnd()}...` : note;
}

function gsmOf(product) {
  const blob = [
    product.name,
    product.product_attributes?.fabric_tag,
    product.product_attributes?.fabric,
    product.description?.[0]?.line1,
  ]
    .map(stripHtml)
    .join(" ");
  const match = blob.match(/(\d{2,3})\s*gsm/i);
  return match ? Number(match[1]) : "";
}

function imageOf(product) {
  const raw = product.meta_image
    ? product.meta_image
    : product.images?.display?.[0]?.name
      ? `https://images.bewakoof.com/original/${product.images.display[0].name}`
      : "";
  if (!raw) return "";
  return `${raw}${raw.includes("?") ? "&" : "?"}tr=w-600`;
}

function buildRow(entry) {
  const product = entry.product;
  const category = categoryOf(product);
  if (!category) return { error: "unsupported category" };
  if (Number(product.in_stock) !== 1) return { error: "out of stock" };

  const sizes = (product.sizes ?? [])
    .filter((size) => size.status === "enabled" && Number(size.qty_avail) > 0)
    .map((size) => size.name);
  if (sizes.length === 0) return { error: "no enabled sizes" };

  const price = Number(product.price);
  const mrp = Number(product.mrp);
  if (!Number.isFinite(price) || price <= 0) return { error: "bad price" };

  const image = imageOf(product);
  if (!image) return { error: "no image" };

  const attrs = product.product_attributes ?? {};
  const fabric = clean(attrs.fabric_tag || attrs.fabric || product.category_info?.fabric);
  const care = clean(attrs.fabric_care) || "Machine wash as per tag";
  const pattern = patternOf(product);
  const sleeve = sleeveOf(product, category);
  const name = clean(product.name);
  if (/mobile cover|combo|pack of/i.test(name)) return { error: "not apparel" };

  return {
    row: {
      item_id: `BW-${product.id}`,
      brand: "Bewakoof",
      name,
      category,
      audience: audienceOf(product),
      price_inr: price,
      mrp_inr: Number.isFinite(mrp) && mrp >= price ? mrp : price,
      fabric,
      gsm: gsmOf(product),
      fit: clean(attrs.fit || product.size_type || ""),
      colour: colourOf(product),
      pattern,
      sleeve,
      care,
      sizes_available: sizes.join("|"),
      fit_note: fitNoteOf(product),
      weather: weatherOf(category, sleeve),
      formality: formalityOf(product, category),
      upkeep: upkeepOf(care),
      use_tags: tagsOf(product, category, pattern),
      source_url: product.canonical_url || entry.source_url,
      collected_on: TODAY,
      collected_by: "agent",
      image_url: image,
      rating: Number.isFinite(Number(product.ratings?.avg)) ? Number(product.ratings.avg) : "",
      rating_count: Number.isFinite(Number(product.ratings?.count)) ? Number(product.ratings.count) : "",
    },
    productId: String(product.id),
    category,
  };
}

function pickPriceDiverse(pool, count) {
  if (pool.length <= count) return pool;
  const sorted = [...pool].sort((a, b) => a.row.price_inr - b.row.price_inr);
  const picked = new Map();
  // always keep the cheapest few, so tight-budget prompts have real answers
  for (const item of sorted.slice(0, Math.min(4, count))) picked.set(item.productId, item);
  const remaining = count - picked.size;
  const rest = sorted.filter((item) => !picked.has(item.productId));
  for (let i = 0; i < remaining; i++) {
    const index = Math.floor((i * rest.length) / remaining);
    picked.set(rest[index].productId, rest[index]);
  }
  return [...picked.values()];
}

const files = fs.existsSync(RAW_DIR)
  ? fs.readdirSync(RAW_DIR).filter((name) => name.endsWith(".jsonl"))
  : [];
if (files.length === 0) {
  console.error(`no raw scrapes in ${RAW_DIR}`);
  process.exit(1);
}

const byId = new Map();
let totalLines = 0;
let withProduct = 0;

for (const file of files) {
  const lines = fs.readFileSync(path.join(RAW_DIR, file), "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    totalLines++;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (!entry.product) continue;
    withProduct++;
    const built = buildRow(entry);
    if (!built.row) continue;
    if (!byId.has(built.productId)) byId.set(built.productId, built);
  }
}

const eligible = [...byId.values()];
const pools = { men: {}, women: {} };
for (const item of eligible) {
  const audience = item.row.audience === "women" ? "women" : "men";
  pools[audience][item.category] ??= [];
  pools[audience][item.category].push(item);
}

const selected = new Map();
for (const audience of ["men", "women"]) {
  for (const [category, quota] of Object.entries(CATEGORY_QUOTAS[audience])) {
    const pool = pools[audience][category] ?? [];
    for (const item of pickPriceDiverse(pool, quota)) selected.set(item.productId, item);
  }
}

let rows = [...selected.values()].map((item) => item.row);

// If a category ran short, top up from any remaining eligible items.
if (rows.length < 300) {
  const rest = eligible
    .filter((item) => !selected.has(item.productId))
    .sort((a, b) => a.row.price_inr - b.row.price_inr);
  for (const item of rest) {
    if (rows.length >= 300) break;
    selected.set(item.productId, item);
    rows.push(item.row);
  }
}

rows.sort(
  (a, b) =>
    a.category.localeCompare(b.category) ||
    a.audience.localeCompare(b.audience) ||
    a.price_inr - b.price_inr ||
    a.name.localeCompare(b.name),
);

const columns = [
  "item_id",
  "brand",
  "name",
  "category",
  "audience",
  "price_inr",
  "mrp_inr",
  "fabric",
  "gsm",
  "fit",
  "colour",
  "pattern",
  "sleeve",
  "care",
  "sizes_available",
  "fit_note",
  "weather",
  "formality",
  "upkeep",
  "use_tags",
  "source_url",
  "collected_on",
  "collected_by",
  "image_url",
  "rating",
  "rating_count",
];

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  Papa.unparse(rows, { columns, newline: "\n" }) + "\n",
  "utf8",
);

const jsonRows = rows.map((row) => ({
  ...row,
  gsm: row.gsm === "" ? null : row.gsm,
  rating: row.rating === "" ? null : row.rating,
  rating_count: row.rating_count === "" ? null : row.rating_count,
  sizes_available: row.sizes_available.split("|").filter(Boolean),
  use_tags: row.use_tags.split("|").filter(Boolean),
}));

fs.writeFileSync(
  path.join(ROOT, "data/catalogue.json"),
  JSON.stringify(jsonRows) + "\n",
  "utf8",
);

const counts = {};
for (const row of rows) counts[row.category] = (counts[row.category] ?? 0) + 1;
const audiences = {};
for (const row of rows) audiences[row.audience] = (audiences[row.audience] ?? 0) + 1;

console.log(`lines=${totalLines} with_product=${withProduct} eligible=${eligible.length} rows=${rows.length}`);
console.log("categories", counts);
console.log("audiences", audiences);
for (const row of rows.slice(0, 0)) console.log(row);
const prices = rows.map((row) => row.price_inr);
console.log(`price min=${Math.min(...prices)} max=${Math.max(...prices)}`);
console.log(`wrote ${OUT}`);
