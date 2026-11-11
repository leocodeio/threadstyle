import { describe, expect, it } from "vitest";

import { filterCatalogue } from "@/lib/filter";
import { makeItem, makeNeed } from "./fixtures";

const tee = makeItem({
  item_id: "TEE-BLACK",
  category: "tee",
  price_inr: 500,
  colour: "Black",
  pattern: "solid",
  weather: "hot_humid",
});

const whiteTee = makeItem({
  item_id: "TEE-WHITE",
  category: "tee",
  price_inr: 300,
  audience: "women",
  colour: "White",
  pattern: "graphic",
  use_tags: ["gym"],
  rating: 3.8,
});

const shirt = makeItem({
  item_id: "SHIRT-WHITE",
  category: "shirt",
  price_inr: 900,
  colour: "White",
  formality: 2,
  weather: "mild",
  use_tags: ["presentation"],
});

const hoodie = makeItem({
  item_id: "HOODIE-BLACK",
  category: "hoodie",
  price_inr: 1_500,
  colour: "Black",
  pattern: "graphic",
  weather: "cold",
  use_tags: ["travel"],
});

const jacket = makeItem({
  item_id: "JACKET-OLIVE",
  category: "jacket",
  price_inr: 2_000,
  colour: "Olive",
  fabric: "Nylon",
  weather: "cold",
  formality: 2,
  use_tags: ["outing"],
  rating: null,
});

const items = [tee, whiteTee, shirt, hoodie, jacket];

describe("filterCatalogue", () => {
  it("filters by category and budget", () => {
    const result = filterCatalogue(
      items,
      makeNeed({ categories: ["tee"], budget_max_inr: 600 }),
    );

    expect(result.reason).toBe("ok");
    expect(
      result.candidates.map((item) => item.item_id).sort(),
    ).toEqual(["TEE-BLACK", "TEE-WHITE"]);
  });

  it("never returns an item above budget", () => {
    const result = filterCatalogue(
      items,
      makeNeed({ budget_max_inr: 600 }),
    );

    expect(
      result.candidates.every((item) => item.price_inr <= 600),
    ).toBe(true);
  });

  it("excludes a colour that the student rejected", () => {
    const result = filterCatalogue(
      items,
      makeNeed({
        categories: ["tee"],
        budget_max_inr: 600,
        colours_exclude: ["black"],
      }),
    );

    expect(result.candidates.map((item) => item.item_id)).toEqual([
      "TEE-WHITE",
    ]);
  });

  it("filters by audience", () => {
    const result = filterCatalogue(
      items,
      makeNeed({ audience: "women", budget_max_inr: 600 }),
    );

    expect(result.candidates.map((item) => item.item_id)).toEqual([
      "TEE-WHITE",
    ]);
  });

  it("stops when the student names another store", () => {
    const result = filterCatalogue(
      items,
      makeNeed({ brand_other: "Nike", categories: ["hoodie"] }),
    );

    expect(result.reason).toBe("other_store");
    expect(result.candidates).toHaveLength(0);
  });

  it("stops when the fabric is not in the catalogue", () => {
    const result = filterCatalogue(
      items,
      makeNeed({
        categories: ["jacket"],
        budget_max_inr: 500,
        fabric_include: ["leather"],
      }),
    );

    expect(result.reason).toBe("fabric");
    expect(result.minPrice).toBe(2_000);
  });

  it("reports the real minimum when the budget is too low", () => {
    const result = filterCatalogue(
      items,
      makeNeed({ categories: ["tee"], budget_max_inr: 100 }),
    );

    expect(result.reason).toBe("budget");
    expect(result.minPrice).toBe(300);
  });

  it("relaxes a soft weather filter instead of returning nothing", () => {
    const result = filterCatalogue(
      items,
      makeNeed({
        categories: ["tee"],
        budget_max_inr: 600,
        weather: "cold",
      }),
    );

    expect(result.reason).toBe("ok");
    expect(result.relaxed).toContain("weather");
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it("keeps colour tone as a ranking preference, not a hard filter", () => {
    const result = filterCatalogue(
      items,
      makeNeed({
        categories: ["tee"],
        budget_max_inr: 600,
        colour_tone: "dark",
      }),
    );

    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]?.item_id).toBe("TEE-BLACK");
  });

  it("diversifies mixed categories", () => {
    const result = filterCatalogue(
      items,
      makeNeed({
        categories: ["tee", "hoodie"],
        budget_max_inr: 2_000,
      }),
    );

    expect(result.candidates.length).toBeGreaterThan(1);
    expect(
      result.candidates.some((item) => item.category === "tee"),
    ).toBe(true);
    expect(
      result.candidates.some((item) => item.category === "hoodie"),
    ).toBe(true);
  });
});
