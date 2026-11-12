import { describe, expect, it } from "vitest";

import { recommend } from "@/lib/recommend";
import { chatSequence, makeParser } from "./fixtures";

function picker(itemId: string, why: string, tradeOff: string) {
  return {
    message: "A piece that fits the request.",
    items: [{ item_id: itemId, why, trade_off: tradeOff }],
  };
}

describe("conversation memory", () => {
  it("keeps the category when the next message is only a budget", async () => {
    const first = await recommend("tee", {
      chat: chatSequence([
        makeParser({
          intent: "clarify",
          missing: ["budget"],
          request: { categories: ["tee"], budget_max_inr: null },
        }),
      ]),
    });

    expect(first.state).toBe("clarify");
    expect(first.meta.prior?.request.categories).toEqual(["tee"]);
    expect(first.meta.prior?.missing).toEqual(["budget"]);

    const second = await recommend("1500", {
      prior: first.meta.prior,
      chat: chatSequence([
        makeParser({ request: { budget_max_inr: 1500 } }),
        picker("BW-390652", "A black tee inside the budget.", "Oversized fit."),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.meta.prior?.request.categories).toEqual(["tee"]);
    expect(second.meta.prior?.request.budget_max_inr).toBe(1500);
    expect(second.items.every((entry) => entry.item.category === "tee")).toBe(
      true,
    );
    expect(second.items.every((entry) => entry.item.price_inr <= 1500)).toBe(
      true,
    );
  });

  it("lowers the budget when the next message is cheaper", async () => {
    const first = await recommend("black tee under 700", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["tee"],
            budget_max_inr: 700,
            colours_include: ["black"],
          },
        }),
        picker("BW-596004", "A black tee inside the budget.", "Oversized fit."),
      ]),
    });

    expect(first.state).toBe("recommend");
    expect(first.meta.prior?.request.budget_max_inr).toBe(700);

    const second = await recommend("cheaper", {
      prior: first.meta.prior,
      chat: chatSequence([
        makeParser({
          references_prior: true,
          request: { budget_max_inr: null },
        }),
        picker("BW-390652", "A lower-priced black tee.", "Oversized fit."),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.meta.prior?.request.budget_max_inr).toBe(550);
    expect(second.meta.prior?.request.categories).toEqual(["tee"]);
    expect(second.items.every((entry) => entry.item.price_inr <= 550)).toBe(
      true,
    );
  });

  it("adds a colour exclusion when the next message says not black", async () => {
    const first = await recommend("oversized tee under 800", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["tee"],
            budget_max_inr: 800,
            fit_include: ["oversized"],
          },
        }),
        picker("BW-596004", "An oversized black tee.", "Oversized fit."),
      ]),
    });

    expect(first.state).toBe("recommend");

    const second = await recommend("same but not black", {
      prior: first.meta.prior,
      chat: chatSequence([
        makeParser({
          references_prior: true,
          request: { colours_exclude: ["black"] },
        }),
        picker(
          "BW-620648",
          "A coral pink oversized tee for the same request.",
          "Oversized fit.",
        ),
      ]),
    });

    expect(second.state).toBe("recommend");
    expect(second.meta.prior?.request.colours_exclude).toContain("black");
    expect(second.meta.prior?.request.fit_include).toContain("oversized");
    expect(
      second.items.every(
        (entry) => !entry.item.colour.toLowerCase().includes("black"),
      ),
    ).toBe(true);
  });

  it("says there is no earlier request in a fresh session", async () => {
    const result = await recommend("same as before but cheaper", {
      chat: chatSequence([makeParser({ references_prior: true })]),
    });

    expect(result.state).toBe("clarify");
    expect(result.message.toLowerCase()).toContain("earlier request");
    expect(result.meta.prior).toBeNull();
  });
});
