# Techstack

Paths from repo root. Next.js only. No Python.

- Next.js (App Router) + TypeScript
- Tailwind CSS
- LLM: OpenCode Go inference API, OpenAI-compatible chat completions
  - key in `OPENCODE_API_KEY`; never in the client
  - 3 roles, all pinned to `deepseek-v4.1-flash`: `parser`, `picker`, `judge`
  - parser + picker in the request path; judge in eval
  - provider gateway `https://opencode.ai/inference/go/openai/v1`
- Zod for catalogue + LLM output; JSON enforced by prompt, repaired once
- `data/catalogue.json` is the database; read-only, no runtime writes
- API in `app/api/recommend/route.ts` (Node, `maxDuration = 60`)
- Playwright, dev only, for the one-off catalogue scrape — not shipped
- Vitest, ESLint, `tsc --noEmit`
- Eval: `npm run eval`; JSONL logs in `logs/`
- Deploy: Vercel, root directory this folder

Layout: `app/ components/ lib/ data/ scripts/ prompts/ eval/ tests/ logs/`

Model IDs in `lib/config.ts`.

```bash
npm install
npm run dev
npm test
npm run eval
npm run check:llm
```
