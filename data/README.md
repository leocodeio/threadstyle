# Catalogue

300 real Bewakoof products, collected on 2026-11-11 from individual product
pages. No invented rows.

- `catalogue.csv` is the source of truth. 23 template columns plus
  `image_url`, `rating`, `rating_count`.
- `catalogue.json` is generated from the CSV for the shop page.
- `npm run catalogue` rebuilds both from `data/raw/scraped/*.jsonl`.
- `data/raw/` is scrape cache and is gitignored.

## Fields

Observed on the product page: `name`, `price_inr`, `mrp_inr`, `fabric`, `fit`,
`colour`, `pattern`, `sleeve`, `care`, `sizes_available`, `source_url`,
`image_url`, `rating`.

Set by our taxonomy after reading the product: `weather`, `formality`,
`upkeep`, `use_tags`, `fit_note`. `gsm` stays blank unless the page mentions it.

## Rules

- Never hand-edit a row. Fix `scripts/build-catalogue.mjs` and rebuild.
- Never edit the golden set.
- Prices move. The catalogue is a snapshot, not a live price feed.
