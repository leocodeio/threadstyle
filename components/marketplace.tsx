"use client";

import { useDeferredValue, useMemo, useState } from "react";

import {
  CATEGORIES,
  CATEGORY_LABELS,
  itemHaystack,
  type Category,
  type CatalogueItem,
} from "@/lib/catalogue";
import { ProductCard } from "@/components/product-card";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const PAGE_SIZE = 48;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Best rated" },
];

export function Marketplace({ items }: { items: CatalogueItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    const tokens = deferredQuery ? deferredQuery.split(/\s+/).filter(Boolean) : [];

    const list = items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (tokens.length === 0) return true;
      const haystack = itemHaystack(item);
      return tokens.every((token) => haystack.includes(token));
    });

    if (sort === "price-asc") list.sort((a, b) => a.price_inr - b.price_inr);
    if (sort === "price-desc") list.sort((a, b) => b.price_inr - a.price_inr);
    if (sort === "rating") {
      list.sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) ||
          (b.rating_count ?? 0) - (a.rating_count ?? 0),
      );
    }

    return list;
  }, [items, category, deferredQuery, sort]);

  const shown = filtered.slice(0, visible);
  const isFiltered = deferredQuery.length > 0 || category !== "all";

  function changeQuery(value: string) {
    setQuery(value);
    setVisible(PAGE_SIZE);
  }

  function changeCategory(value: "all" | Category) {
    setCategory(value);
    setVisible(PAGE_SIZE);
  }

  function changeSort(value: SortKey) {
    setSort(value);
    setVisible(PAGE_SIZE);
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setSort("featured");
    setVisible(PAGE_SIZE);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1">
        <section className="mx-auto w-full max-w-[720px] px-5 pb-8 pt-10 text-center sm:px-8 sm:pt-12">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Campus catalogue · {items.length} pieces
          </p>

          <h1 className="mt-4 font-heading text-[36px] font-semibold leading-[1.04] tracking-[-0.035em] text-balance sm:text-[48px]">
            Wear something that fits the day.
          </h1>

          <p className="mx-auto mt-3 max-w-[50ch] text-[14px] leading-6 text-muted-foreground sm:text-[15px]">
            Real Bewakoof pieces, real prices. Search by piece, colour, or
            fabric.
          </p>

          <div className="relative mx-auto mt-7 w-full max-w-[560px]">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="m12.5 12.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>

            <label htmlFor="catalogue-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="catalogue-search"
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Search tees, colours, fabric…"
              autoComplete="off"
              className="h-14 w-full rounded-[6px] border border-border bg-card pl-12 pr-20 text-[15px] text-foreground shadow-none outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => changeQuery("")}
                className="absolute right-3 top-1/2 h-8 -translate-y-1/2 rounded-[4px] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div
            className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter by category"
          >
            <button
              type="button"
              onClick={() => changeCategory("all")}
              aria-pressed={category === "all"}
              className={`${chipClass(category === "all")} shrink-0`}
            >
              All
            </button>
            {CATEGORIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeCategory(value)}
                aria-pressed={category === value}
                className={`${chipClass(category === value)} shrink-0`}
              >
                {CATEGORY_LABELS[value]}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground" aria-live="polite">
              {filtered.length === items.length
                ? `${items.length} pieces`
                : `${filtered.length} of ${items.length} pieces`}
              {isFiltered ? " · filtered" : ""}
            </p>

            <label className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(event) => changeSort(event.target.value as SortKey)}
                className="h-8 rounded-[4px] border border-border bg-card px-2 font-sans text-[12px] font-medium normal-case tracking-normal text-foreground outline-none transition-colors focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {shown.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4">
              {shown.map((item, index) => (
                <ProductCard key={item.item_id} item={item} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 border border-border bg-card px-6 py-16 text-center">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Nothing matches
              </p>
              <p className="max-w-[42ch] text-[15px] leading-6">
                No piece matches that search. Try a colour, a category, or a
                fabric instead.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 h-9 rounded-[4px] border border-border px-3 text-[12px] font-medium transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Clear filters
              </button>
            </div>
          )}

          {filtered.length > shown.length ? (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                Showing {shown.length} of {filtered.length}
              </p>
              <button
                type="button"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
                className="h-10 rounded-[6px] border border-border bg-card px-5 text-[13px] font-medium transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Load more
              </button>
            </div>
          ) : null}

          {shown.length > 0 && filtered.length <= PAGE_SIZE ? (
            <p className="mt-10 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </p>
          ) : null}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-5 py-6 text-[12px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Thread · IIIT-H AI for PMs, sem 3</p>
          <p>
            Catalogue collected from Bewakoof on 11 Nov 2026. Prices and stock
            change on the store.
          </p>
        </div>
      </footer>
    </div>
  );
}

function chipClass(active: boolean): string {
  return [
    "h-8 rounded-[4px] border px-3 text-[12px] font-medium transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:border-foreground",
  ].join(" ");
}
