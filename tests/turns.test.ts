import { describe, expect, it } from "vitest";

import {
  MAX_TURNS,
  appendTurn,
  parseTurns,
  pastTurns,
  type Turn,
} from "@/lib/turns";

function turn(n: number): Turn {
  return {
    id: `t${n}`,
    asked: `question ${n}`,
    result: {
      state: "clarify",
      message: "What's your budget?",
      items: [],
    } as unknown as Turn["result"],
  };
}

describe("chat history", () => {
  it("appends turns in order and keeps only the newest MAX_TURNS", () => {
    let turns: Turn[] = [];
    for (let n = 1; n <= MAX_TURNS + 5; n += 1) turns = appendTurn(turns, turn(n));
    expect(turns).toHaveLength(MAX_TURNS);
    expect(turns[0].id).toBe("t6");
    expect(turns[turns.length - 1].id).toBe(`t${MAX_TURNS + 5}`);
  });

  it("round-trips through storage", () => {
    const turns = [turn(1), turn(2)];
    expect(parseTurns(JSON.stringify(turns))).toEqual(turns);
  });

  it("ignores missing, broken, or malformed saved data", () => {
    expect(parseTurns(null)).toEqual([]);
    expect(parseTurns("not json")).toEqual([]);
    expect(parseTurns('{"a":1}')).toEqual([]);
    expect(parseTurns(JSON.stringify([turn(1), { id: 3 }, { asked: "x" }]))).toEqual([
      turn(1),
    ]);
  });

  it("leaves out the newest turn only while it is shown as the live result", () => {
    const turns = [turn(1), turn(2), turn(3)];
    expect(pastTurns(turns, true).map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(pastTurns(turns, false).map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
    expect(pastTurns([], true)).toEqual([]);
  });
});
