import type { RecommendResponse } from "./recommend-types";

export type Turn = {
  readonly id: string;
  readonly asked: string;
  readonly result: RecommendResponse;
};

// Enough to scroll back through a long shopping session without letting
// sessionStorage grow without bound (each turn holds up to six item cards).
export const MAX_TURNS = 20;

const STATES = new Set(["recommend", "clarify", "decline", "no_match", "error"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTurn(value: unknown): value is Turn {
  if (!isRecord(value) || !isRecord(value.result)) return false;
  const result = value.result;
  return (
    typeof value.id === "string" &&
    typeof value.asked === "string" &&
    typeof result.state === "string" &&
    STATES.has(result.state) &&
    typeof result.message === "string" &&
    Array.isArray(result.items)
  );
}

export function appendTurn(turns: readonly Turn[], turn: Turn): Turn[] {
  return [...turns, turn].slice(-MAX_TURNS);
}

export function parseTurns(raw: string | null): Turn[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isTurn).slice(-MAX_TURNS);
  } catch {
    return [];
  }
}

// While a request is running, failed, or just restored after a refresh, every
// saved turn is history. Once the newest answer is on screen it is shown by
// the live result block instead, so it is left out here to avoid a duplicate.
export function pastTurns(
  turns: readonly Turn[],
  showingLatest: boolean,
): readonly Turn[] {
  return showingLatest ? turns.slice(0, -1) : turns;
}
