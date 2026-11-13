import { describe, expect, it } from "vitest";

import { catalogue } from "@/lib/catalogue-data";
import { filterCatalogue } from "@/lib/filter";
import { recommend } from "@/lib/recommend";
import { chatSequence, makeItem, makeNeed, makeParser } from "./fixtures";

function pick(itemId: string, why: string, tradeOff: string) {
  return {
    message: "A piece that fits the request.",
    items: [{ item_id: itemId, why, trade_off: tradeOff }],
  };
}

describe("other stores (G27, G28, G42)", () => {
  it("offers Bewakoof items, shows none, and delivers on 'yes'", async () => {
    const first = await recommend("Nike hoodie under 1500", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["hoodie"],
            budget_max_inr: 1500,
            brand_other: "Nike",
          },
        }),
      ]),
    });

    expect(first.state).toBe("no_match");
    expect(first.items).toHaveLength(0);
    expect(first.message).toContain("I only cover Bewakoof");
    expect(first.message).toContain('Say "yes"');
    expect(first.meta.prior?.offer).toBe(true);
    expect(first.meta.prior?.request.brand_other).toBeNull();

    // "yes" must not call the parser: the only fake response is the picker.
    const second = await recommend("yes", {
      prior: first.meta.prior,
      chat: chatSequence([
        pick("BW-596572", "Grey hoodie inside the budget.", "Regular fit."),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.items.length).toBeGreaterThan(0);
    expect(second.items.every((e) => e.item.category === "hoodie")).toBe(true);
    expect(second.items.every((e) => e.item.price_inr <= 1500)).toBe(true);
  });

  it("asks for a budget instead of clarifying when the store has no budget (G28)", async () => {
    const first = await recommend("price of the black tee in Zudio", {
      chat: chatSequence([
        makeParser({
          intent: "clarify",
          missing: ["budget"],
          request: {
            categories: ["tee"],
            budget_max_inr: null,
            brand_other: "Zudio",
          },
        }),
      ]),
    });

    expect(first.state).toBe("no_match");
    expect(first.items).toHaveLength(0);
    expect(first.message).toContain("I only cover Bewakoof");
    expect(first.message.toLowerCase()).toContain("budget");
    expect(first.meta.prior?.missing).toEqual(["budget"]);

    const second = await recommend("800", {
      prior: first.meta.prior,
      chat: chatSequence([
        makeParser({ request: { budget_max_inr: 800 } }),
        pick("BW-555436", "A black tee inside the budget.", "Regular fit."),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.items.every((e) => e.item.category === "tee")).toBe(true);
  });

  it("does not treat 'yes' as an offer when none was made", async () => {
    const result = await recommend("yes", {
      chat: chatSequence([
        makeParser({
          intent: "clarify",
          missing: ["category", "budget"],
          request: { budget_max_inr: null },
        }),
      ]),
    });
    expect(result.state).toBe("clarify");
  });
});

describe("audience (G08, G41)", () => {
  it("says which audience is shown and how to switch", async () => {
    const result = await recommend("light cotton shirt, 1000", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["shirt"],
            budget_max_inr: 1000,
            weather: "hot_humid",
          },
        }),
        pick("BW-633536", "A black cotton crop shirt.", "Crop length."),
      ]),
    });

    expect(result.state).toBe("recommend");
    const audiences = new Set(result.items.map((e) => e.item.audience));
    expect(audiences.size).toBe(1);
    expect(result.message).toMatch(/Showing (men's|women's) pieces/);
  });

  it("switches audience when the next message is only 'women's'", async () => {
    const first = await recommend("black tee under 800", {
      chat: chatSequence([
        makeParser({
          request: { categories: ["tee"], budget_max_inr: 800 },
        }),
        pick("BW-555436", "A black tee inside the budget.", "Regular fit."),
      ]),
    });
    expect(first.meta.prior?.request.audience).toBeNull();

    const second = await recommend("women's", {
      prior: first.meta.prior,
      chat: chatSequence([
        makeParser({
          intent: "clarify",
          missing: ["category", "budget"],
          request: { audience: "women", budget_max_inr: null },
        }),
        pick("BW-463625", "A pink tee inside the budget.", "Oversized fit."),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.items.every((e) => e.item.audience === "women")).toBe(true);
    expect(second.items.every((e) => e.item.price_inr <= 800)).toBe(true);
  });

  it("does not add a note when the student named the audience", async () => {
    const result = await recommend("women's black tee under 800", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["tee"],
            budget_max_inr: 800,
            audience: "women",
          },
        }),
        pick("BW-463625", "A pink tee inside the budget.", "Oversized fit."),
      ]),
    });
    expect(result.message).not.toContain("Showing");
  });
});

describe("reason text", () => {
  it("never shows snake_case tags to the student", async () => {
    const need = makeNeed({ categories: ["tee"], budget_max_inr: 800 });
    const [candidate, second] = filterCatalogue(catalogue, need).candidates;
    expect(candidate).toBeDefined();
    expect(second).toBeDefined();
    const result = await recommend("tee under 800", {
      chat: chatSequence([
        makeParser({ request: { categories: ["tee"], budget_max_inr: 800 } }),
        {
          message: "Two tees inside the budget.",
          items: [
            {
              item_id: candidate?.item_id ?? "",
              why: "Tagged hot_humid, so it suits a hot day.",
              trade_off: "Basic cotton finish.",
            },
            {
              item_id: second?.item_id ?? "",
              why: "Also rated hot_humid and inside the budget.",
              trade_off: "Plain print.",
            },
          ],
        },
      ]),
    });

    const text = result.items.map((e) => `${e.why} ${e.trade_off}`).join(" ");
    expect(text).not.toContain("hot_humid");
    expect(text).toContain("hot and humid");
  });

  it("writes a readable reason when the model output is unusable", async () => {
    const bad = {
      message: "x",
      items: [{ item_id: "NOT-REAL", why: "w", trade_off: "t" }],
    };
    const result = await recommend("black tee under 800", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["tee"],
            budget_max_inr: 800,
            fabric_include: ["cotton"],
            weather: "hot_humid",
          },
        }),
        bad,
        bad,
      ]),
    });

    expect(result.items.length).toBeGreaterThan(0);
    for (const entry of result.items) {
      expect(entry.why).not.toContain("good for cotton");
      expect(entry.why).toContain("inside your");
    }
  });
});

describe("picker top-up", () => {
  it("keeps the model's one good pick and tops up from the filter", async () => {
    const need = makeNeed({ categories: ["tee"], budget_max_inr: 800 });
    const [first] = filterCatalogue(catalogue, need).candidates;
    const result = await recommend("black tee under 800", {
      chat: chatSequence([
        makeParser({ request: { categories: ["tee"], budget_max_inr: 800 } }),
        pick(
          first?.item_id ?? "",
          "Plain tee inside your budget.",
          "Basic cotton finish.",
        ),
      ]),
    });

    expect(result.state).toBe("recommend");
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0]?.why).toBe("Plain tee inside your budget.");
    expect(result.items[0]?.item.item_id).toBe(first?.item_id);
  });
});

describe("open requests", () => {
  const tees = [1, 2, 3, 4, 5].map((n) =>
    makeItem({ item_id: `TEE-${n}`, category: "tee", price_inr: 300 + n }),
  );
  const jeans = makeItem({
    item_id: "JEANS-1",
    category: "jeans",
    price_inr: 900,
  });
  const hoodie = makeItem({
    item_id: "HOODIE-1",
    category: "hoodie",
    price_inr: 800,
    weather: "cold",
  });

  it("leaves warm-weather pieces out when no weather or category is given", () => {
    const result = filterCatalogue([...tees, jeans, hoodie], makeNeed());
    expect(result.candidates.some((i) => i.category === "hoodie")).toBe(false);
  });

  it("keeps a hoodie when the student asks for one", () => {
    const result = filterCatalogue(
      [...tees, jeans, hoodie],
      makeNeed({ categories: ["hoodie"] }),
    );
    expect(result.candidates.map((i) => i.item_id)).toEqual(["HOODIE-1"]);
  });

  it("shows a spread of categories when none is named", () => {
    const result = filterCatalogue([...tees, jeans], makeNeed());
    const categories = new Set(result.candidates.map((i) => i.category));
    expect(categories.has("jeans")).toBe(true);
    expect(
      result.candidates.filter((i) => i.category === "tee").length,
    ).toBeLessThanOrEqual(2);
  });
});
