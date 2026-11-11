import type { RecommendResponse } from "../lib/recommend-types";
import type { JudgeInput, JudgeItem } from "../prompts/judge";
import type { GoldenRow } from "./checks";

function toJudgeItem(entry: RecommendResponse["items"][number]): JudgeItem {
  return {
    name: entry.item.name,
    category: entry.item.category,
    price_inr: entry.item.price_inr,
    colour: entry.item.colour,
    fabric: entry.item.fabric,
    fit: entry.item.fit,
    pattern: entry.item.pattern,
    sleeve: entry.item.sleeve,
    care: entry.item.care,
    weather: entry.item.weather,
    formality: entry.item.formality,
    upkeep: entry.item.upkeep,
    use_tags: entry.item.use_tags,
    why: entry.why,
    trade_off: entry.trade_off,
  };
}

export function judgeInput(
  row: GoldenRow,
  result: RecommendResponse,
): JudgeInput {
  return {
    request: row.input,
    expectedBehaviour: row.expected_behavior,
    maxPriceInr: row.max_price_inr,
    categoriesAny: row.categories_any,
    mustNot: row.must_not,
    judgeCheck: row.judge_check,
    state: result.state,
    message: result.message,
    items: result.items.map(toJudgeItem),
  };
}
