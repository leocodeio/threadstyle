import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Thread turns one request into a short, personal shortlist from 300 real Bewakoof pieces.",
};

const SIGNALS = [
  {
    label: "Budget",
    detail: "A hard ceiling. We never show a piece above it.",
  },
  {
    label: "Category",
    detail:
      "Tee, shirt, hoodie, sweatshirt, jacket, joggers, jeans, or shorts.",
  },
  {
    label: "Colour",
    detail:
      "Colours to include, and colours to avoid. “Not black” is respected.",
  },
  {
    label: "Fabric",
    detail:
      "Cotton, linen, leather, nylon, mesh, viscose, and other materials the catalogue records.",
  },
  {
    label: "Weather",
    detail: "Hot and humid, mild, or cold.",
  },
  {
    label: "Occasion",
    detail:
      "Class, hostel, fest, travel, gym, outing, presentation, or everyday.",
  },
  {
    label: "Formality",
    detail:
      "Casual or smart-casual. A presentation or interview raises the floor.",
  },
  {
    label: "Fit",
    detail: "Oversized, regular, relaxed, baggy, slim, or straight.",
  },
] as const;

const PIPELINE = [
  {
    number: "01",
    title: "Parse",
    body: "Free text becomes a typed request: intent, category, budget, colour, fabric, weather, occasion, formality, fit, and exclusions. The parser never invents a budget. If the piece or the budget is missing, we ask one short question instead of guessing.",
  },
  {
    number: "02",
    title: "Filter",
    body: "Code applies the hard limits: budget, category, audience, excluded colours, other stores, and impossible fabrics. Soft preferences are relaxed one at a time if they would empty the shelf. The picker sees up to 10 candidates, not 300.",
  },
  {
    number: "03",
    title: "Pick",
    body: "The picker, deepseek-v4.1-flash, chooses one to three items by item_id. It writes a why in the student’s words and one honest trade-off. It never supplies a product name, a price, or a URL.",
  },
  {
    number: "04",
    title: "Validate",
    body: "Every item_id is checked against the catalogue, capped at three, and filled with name, price, colour, fabric, care, and link from data/catalogue.json. If the model fails, a deterministic fallback still returns real pieces.",
  },
] as const;

const NEVER = [
  "judge how a piece will look on your body",
  "comment on skin tone or attractiveness",
  "predict a size from height and weight",
  "invent a product, a price, or a URL",
  "stretch a budget",
  "place an order or take a payment",
  "quote another store",
  "remember an earlier request",
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader active="how" />

      <main className="mx-auto flex w-full max-w-[768px] flex-1 flex-col px-6 py-8">
        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            How it works
          </p>
          <h1 className="mt-4 max-w-[22ch] font-heading text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-balance">
            Personal, not guessed.
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-6 text-muted-foreground">
            Every pick comes from your words and the catalogue. The model
            chooses; the code holds the limits.
          </p>
        </section>

        <section className="mt-8 rounded-[6px] border border-border border-l-[3px] border-l-primary bg-card p-5">
          <h2 className="sr-only">The short version</h2>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            The short version
          </p>
          <ol className="mt-3 flex flex-col gap-4">
            <li className="grid grid-cols-[28px_1fr] gap-3">
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                01
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-6">
                  You describe the day
                </h3>
                <p className="mt-0.5 text-[14px] leading-6 text-muted-foreground">
                  Budget, weather, occasion, colour, fabric — in English or
                  Hinglish.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[28px_1fr] gap-3">
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                02
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-6">
                  Code narrows the catalogue
                </h3>
                <p className="mt-0.5 text-[14px] leading-6 text-muted-foreground">
                  Hard limits first, then soft preferences. The picker sees up
                  to 10 real candidates.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[28px_1fr] gap-3">
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                03
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-6">
                  The stylist picks and explains
                </h3>
                <p className="mt-0.5 text-[14px] leading-6 text-muted-foreground">
                  Up to three pieces, a why, and one trade-off. Every fact is
                  filled from the catalogue.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-[22px] font-semibold leading-7 tracking-[-0.02em]">
            What we read
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
            These are the signals the parser extracts. If a hard one is missing,
            we ask instead of inventing it.
          </p>
          <dl className="mt-4 border-t border-border">
            {SIGNALS.map((signal) => (
              <div
                key={signal.label}
                className="grid gap-1 border-b border-border py-3 sm:grid-cols-[150px_1fr] sm:gap-4"
              >
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {signal.label}
                </dt>
                <dd className="text-[14px] leading-6">{signal.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-[22px] font-semibold leading-7 tracking-[-0.02em]">
            The pipeline
          </h2>
          <ol className="mt-4 flex flex-col gap-6">
            {PIPELINE.map((step) => (
              <li key={step.number} className="border-t border-border pt-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {step.number}
                  </span>
                  <h3 className="text-[17px] font-semibold leading-6">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2 max-w-[64ch] text-[14px] leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-[22px] font-semibold leading-7 tracking-[-0.02em]">
            What personal means here
          </h2>
          <p className="mt-2 max-w-[64ch] text-[15px] leading-6 text-muted-foreground">
            Personal does not mean a profile. There is no login, no stored
            history, and no memory between requests. Each answer is personal
            because it uses the constraints you just gave us and the actual
            fields of the pieces.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[6px] border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                We use
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-5">
                <li>the words you just typed</li>
                <li>budget, weather, occasion, colour, fabric, fit</li>
                <li>the catalogue fields: price, fabric, fit, care, rating</li>
                <li>the trade-off you should know about</li>
              </ul>
            </div>
            <div className="rounded-[6px] border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                We do not use
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-5">
                <li>your name, login, or purchase history</li>
                <li>your body, skin tone, height, or weight</li>
                <li>your location or another store</li>
                <li>anything from an earlier request</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-[22px] font-semibold leading-7 tracking-[-0.02em]">
            What we won&apos;t do
          </h2>
          <ul className="mt-3 border-t border-border">
            {NEVER.map((item) => (
              <li
                key={item}
                className="flex gap-3 border-b border-border py-2.5 text-[14px] leading-6"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[6px] border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            How we check it
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="font-mono text-[28px] font-semibold tabular-nums">
              30/30
            </p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              deterministic checks
            </p>
            <p className="font-mono text-[28px] font-semibold tabular-nums">
              30/30
            </p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              judge checks
            </p>
          </div>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-6 text-muted-foreground">
            Thirty golden requests cover happy paths, Hinglish, missing budgets,
            impossible budgets, other stores, and adversarial asks. The judge is
            a separate role pinned to the same model. The score is a snapshot
            from 11 Nov 2026, not a promise.
          </p>
        </section>

        <section className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
          <Link
            href="/ask"
            className="inline-flex h-11 items-center justify-center rounded-[6px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Ask the stylist
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[6px] border border-border px-4 text-[13px] font-medium transition-colors duration-150 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Browse the catalogue
          </Link>
        </section>

        <p className="mt-8 text-[10.5px] leading-4 text-muted-foreground">
          Catalogue collected from Bewakoof on 11 Nov 2026. Prices and stock
          change on the store. No body, skin-tone, or size judgement.
        </p>
      </main>
    </div>
  );
}
