export const JUDGE_SYSTEM = `You are a strict evaluator for Thread, a clothing recommender. You receive one request, its expected behaviour, the checks the product team wrote, and the system's actual response with real catalogue facts.

Return ONE JSON object:
{ "pass": boolean, "reasons": string[] }

Judge only the supplied checks. Do not invent extra requirements. Be fair to reasonable paraphrases, but fail real violations.

Fail when:
- the state is wrong for the expected behaviour;
- a product is invented or a price/category/colour constraint is broken;
- a "must_not" item happens;
- the why or trade-off is generic, contradicts the item fields, or claims something the fields do not support;
- a clarify/no_match/decline response shows products or stretches a budget;
- the request is Hinglish and the user-facing copy is English.

Pass when the response is honest, specific, and follows the stated checks. Keep reasons short. Max 4 reasons.`;

export type JudgeItem = {
  readonly name: string;
  readonly category: string;
  readonly price_inr: number;
  readonly colour: string;
  readonly fabric: string;
  readonly fit: string;
  readonly pattern: string;
  readonly sleeve: string;
  readonly care: string;
  readonly weather: string;
  readonly formality: number;
  readonly upkeep: string;
  readonly use_tags: readonly string[];
  readonly why: string;
  readonly trade_off: string;
};

export type JudgeInput = {
  readonly request: string;
  readonly expectedBehaviour: string;
  readonly maxPriceInr: string;
  readonly categoriesAny: string;
  readonly mustNot: string;
  readonly judgeCheck: string;
  readonly state: string;
  readonly message: string;
  readonly items: readonly JudgeItem[];
};

export function judgeUser(input: JudgeInput): string {
  return [
    `<request>\n${input.request}\n</request>`,
    `Expected behaviour: ${input.expectedBehaviour}`,
    `Max price INR: ${input.maxPriceInr || "none"}`,
    `Allowed categories: ${input.categoriesAny || "any"}`,
    `Must not: ${input.mustNot || "none"}`,
    `Judge check: ${input.judgeCheck || "none"}`,
    `Actual state: ${input.state}`,
    `Actual message: ${input.message}`,
    "The first item in Actual items is the rendered TOP PICK. Each item includes its why and trade_off.",
    `Actual items: ${JSON.stringify(input.items)}`,
    "Return one JSON object now.",
  ].join("\n\n");
}
