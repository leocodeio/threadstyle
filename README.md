# Thread

Campus clothing catalogue for IIIT-H AI for PMs, sem 3.

The home page is the shop: 300 real Bewakoof pieces, searchable by category,
colour, or fabric. The stylist lives on `/ask` and in the floating panel on the
shop. Describe the day, budget, and occasion in English or Hinglish. Thread
filters the catalogue, asks `deepseek-v4.1-flash` to pick up to three, and
renders the cards from the catalogue. The model never supplies a price, name,
or URL.

- `/` — the shop; the floating `Ask the stylist` panel reuses the pipeline
- `/ask` — ask for a recommendation
- `/shop` — redirects to `/`
- `/how-it-works` — how the parser, filter, picker, and validation turn one
  request into a personal shortlist

## How it works

```
request
  -> parser (deepseek-v4.1-flash) -> structured need
  -> code filter over data/catalogue.json
  -> picker (deepseek-v4.1-flash) -> item_ids + why + trade-off
  -> whitelist + cap + render
```

The parser and picker are separate calls. The judge is a third role, pinned to
the same model, and runs in `npm run eval` rather than on every request.

## Run

```bash
npm install
cp .env.example .env.local      # add OPENCODE_API_KEY
npm run check:llm               # verifies key, gateway, model, JSON mode
npm run dev
```

Open `http://localhost:3000`.

`OPENCODE_BASE_URL` defaults to the Go gateway. If you are on pay-as-you-go,
set it to `https://opencode.ai/inference/openai/v1`.

The key stays server-side in the route handler. Nothing is exposed with
`NEXT_PUBLIC_`.

## Deploy

1. Import this folder into Vercel. Root directory:
   `iiith/sem3/ai-for-product-managers/project/first-sub`.
2. Add `OPENCODE_API_KEY` to Production, Preview, and Development.
3. In the OpenCode Console, make sure the workspace is on Go and that
   **Regions** includes **Global** for DeepSeek V4.1 Flash.
4. Deploy. Then:

```bash
node scripts/smoke.mjs https://your-deployment.vercel.app
```

The API route is a Node function with `maxDuration = 60`. The catalogue is
bundled; there are no runtime file writes and no database.

## Eval

```bash
npm run eval
```

Reads `references/golden_set_v0.csv` (never edited), calls the same pipeline,
runs deterministic checks plus the judge, prints a table, and writes
`logs/eval-<timestamp>.jsonl`.

`npm test` runs the unit suite with a fake model, so it needs no key.

Last run (11 Nov 2026): **30/30 deterministic, 30/30 judge**, mean 13.4s.
The JSONL log is in `logs/` (gitignored).

## Data

- `data/catalogue.csv` — 300 rows, source of truth.
- `data/catalogue.json` — generated for the app.
- `npm run catalogue` — rebuild both from the scrape cache.

See `data/README.md` for fields and collection rules. Design rules live in
`DESIGN.md`; agent notes live in `.agents/`; the build plan is `PLAN.md`.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
