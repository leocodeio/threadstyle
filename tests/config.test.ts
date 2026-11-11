import { describe, expect, it } from "vitest";

import { MODELS } from "@/lib/config";

describe("models", () => {
  it("pins parser, picker, and judge to deepseek-v4.1-flash", () => {
    expect(MODELS.parser).toBe("deepseek-v4.1-flash");
    expect(MODELS.picker).toBe("deepseek-v4.1-flash");
    expect(MODELS.judge).toBe("deepseek-v4.1-flash");
  });
});
