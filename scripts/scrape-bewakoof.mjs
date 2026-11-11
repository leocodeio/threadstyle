#!/usr/bin/env node
// Scrape real Bewakoof product data for the frozen MVP catalogue.
// Usage: node scripts/scrape-bewakoof.mjs <urls.txt> <out.jsonl> [concurrency]
//
// Reads one product URL per line, opens the product page in Chromium, and
// writes one JSON object per line: { source_url, scraped_at, product }.
// `product` is the page's own pageProps.productDetails object, untouched.
// Safe to re-run: URLs already present in the output file are skipped.

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [, , listPath, outPath, concArg] = process.argv;
if (!listPath || !outPath) {
  console.error("usage: node scripts/scrape-bewakoof.mjs <urls.txt> <out.jsonl> [concurrency]");
  process.exit(2);
}

const concurrency = Number(concArg || 2);
const urls = fs
  .readFileSync(listPath, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("http"));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const seen = new Set();
if (fs.existsSync(outPath)) {
  for (const line of fs.readFileSync(outPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row.product) seen.add(row.source_url);
    } catch {}
  }
}

const todo = urls.filter((url) => !seen.has(url));
const out = fs.createWriteStream(outPath, { flags: "a" });
const started = Date.now();
let done = 0;
let failed = 0;

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

async function launch() {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
}

let browser = await launch();

async function makePage() {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-IN",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  return { context, page };
}

async function scrape(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#__NEXT_DATA__", { timeout: 20000, state: "attached" });
  const product = await page.$eval("#__NEXT_DATA__", (el) => {
    const data = JSON.parse(el.textContent);
    return data?.props?.pageProps?.productDetails ?? null;
  });
  if (!product || !product.name) throw new Error("no productDetails");
  return product;
}

async function worker() {
  let handle = await makePage();
  let sinceRestart = 0;

  for (;;) {
    const url = todo.shift();
    if (!url) break;

    let product = null;
    let error = null;
    for (let attempt = 1; attempt <= 2 && !product; attempt++) {
      try {
        product = await scrape(handle.page, url);
      } catch (err) {
        error = String(err?.message ?? err);
        try {
          if (handle.page.isClosed()) throw new Error("page closed");
          await handle.page.waitForTimeout(1000 * attempt);
        } catch {
          await handle.context.close().catch(() => {});
          try {
            if (!browser.isConnected()) browser = await launch();
          } catch {}
          handle = await makePage();
          sinceRestart = 0;
        }
      }
    }

    done++;
    sinceRestart++;
    if (product) {
      out.write(
        JSON.stringify({
          source_url: url,
          scraped_at: new Date().toISOString(),
          product,
        }) + "\n",
      );
      console.log(`[${done}/${urls.length}] ok ${product.name.slice(0, 60)}`);
    } else {
      failed++;
      out.write(JSON.stringify({ source_url: url, error }) + "\n");
      console.log(`[${done}/${urls.length}] FAIL ${url} ${error}`);
    }

    // Chromium leaks across navigations; a fresh context every 12 pages keeps
    // memory flat on long runs.
    if (sinceRestart >= 12) {
      await handle.context.close().catch(() => {});
      try {
        if (!browser.isConnected()) browser = await launch();
      } catch {}
      handle = await makePage();
      sinceRestart = 0;
    }
  }

  await handle.context.close().catch(() => {});
}

const workers = Math.min(concurrency, todo.length);
await Promise.all(Array.from({ length: workers }, () => worker()));
out.end();
await browser.close().catch(() => {});

const seconds = ((Date.now() - started) / 1000).toFixed(0);
console.log(`done=${done} failed=${failed} in ${seconds}s -> ${outPath}`);
