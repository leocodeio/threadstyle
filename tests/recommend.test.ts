import { describe, expect, it } from "vitest";

import { recommend } from "@/lib/recommend";
import { chatSequence, makeParser } from "./fixtures";

describe("recommend", () => {
  it("returns a real item inside the budget", async () => {
    const result = await recommend("plain black tee under 700", {
      chat: chatSequence([
        makeParser({
          request: {
            categories: ["tee"],
            budget_max_inr: 700,
            colours_include: ["black"],
            pattern_include: ["solid"],
          },
        }),
        {
          message: "A plain black tee that fits the budget.",
          items: [
            {
              item_id: "BW-596004",
              why: "Plain black and solid, with an oversized fit for class.",
              trade_off: "Oversized, so check the size chart.",
            },
          ],
        },
      ]),
    });

    expect(result.state).toBe("recommend");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.item.item_id).toBe("BW-596004");
    expect(result.items[0]?.item.price_inr).toBeLessThanOrEqual(700);
  });

  it("drops invented ids and falls back to real candidates", async () => {
    const result = await recommend("tee under 700", {
      chat: chatSequence([
        makeParser({
          request: { categories: ["tee"], budget_max_inr: 700 },
        }),
        {
          message: "Here is one.",
          items: [
            {
              item_id: "NOT-REAL",
              why: "Invented.",
              trade_off: "Invented.",
            },
          ],
        },
      ]),
    });

    expect(result.state).toBe("recommend");
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((entry) => entry.item.item_id !== "NOT-REAL"),
    ).toBe(true);
  });

  it("caps the result at three items", async () => {
    const fiveIds = [
      "BW-390652",
      "BW-390475",
      "BW-554010",
      "BW-604531",
      "BW-642533",
    ];

    const result = await recommend("tee under 700", {
      chat: chatSequence([
        makeParser({
          request: { categories: ["tee"], budget_max_inr: 700 },
        }),
        {
          message: "Five picks.",
          items: fiveIds.map((item_id) => ({
            item_id,
            why: "A tee inside the budget.",
            trade_off: "Check the size chart.",
          })),
        },
      ]),
    });

    expect(result.state).toBe("recommend");
    expect(result.items).toHaveLength(3);
  });

  it("asks for a budget instead of recommending", async () => {
    const result = await recommend("I need a tee", {
      chat: chatSequence([
        makeParser({
          intent: "clarify",
          missing: ["budget"],
          request: { categories: ["tee"], budget_max_inr: null },
        }),
      ]),
    });

    expect(result.state).toBe("clarify");
    expect(result.items).toHaveLength(0);
    expect(result.message.toLowerCase()).toContain("budget");
  });

  it("declines a body judgement request", async () => {
    const result = await recommend("Which colour suits my skin tone?", {
      chat: chatSequence([
        makeParser({
          intent: "decline",
          decline_reason: "body",
        }),
      ]),
    });

    expect(result.state).toBe("decline");
    expect(result.items).toHaveLength(0);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("returns no-match and the real minimum for a low budget", async () => {
    const result = await recommend("tee under 100", {
      chat: chatSequence([
        makeParser({
          request: { categories: ["tee"], budget_max_inr: 100 },
        }),
      ]),
    });

    expect(result.state).toBe("no_match");
    expect(result.items).toHaveLength(0);
    expect(result.message).toContain("319");
  });
});
