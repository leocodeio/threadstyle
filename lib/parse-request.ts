import { requestJson, type ChatFn } from "./llm";
import { MAX_OUTPUT_TOKENS, PARSER_TIMEOUT_MS } from "./config";
import { parserUser, PARSER_SYSTEM } from "../prompts/parser";
import {
  parsedRequestSchema,
  type MissingField,
  type ParsedRequest,
} from "./recommend-types";

function normalizeList(values: readonly string[]): string[] {
  const cleaned = values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return [...new Set(cleaned)];
}

function normalizeParsed(parsed: ParsedRequest): ParsedRequest {
  const categories = [...new Set(parsed.request.categories)];
  const useTags = [...new Set(parsed.request.use_tags)];
  const brand = parsed.request.brand_other?.trim() ?? "";
  const brandOther =
    brand.length > 0 && brand.toLowerCase() !== "bewakoof" ? brand : null;

  const request = {
    ...parsed.request,
    categories,
    use_tags: useTags,
    colours_include: normalizeList(parsed.request.colours_include),
    colours_exclude: normalizeList(parsed.request.colours_exclude),
    fabric_include: normalizeList(parsed.request.fabric_include),
    fit_include: normalizeList(parsed.request.fit_include),
    pattern_include: normalizeList(parsed.request.pattern_include),
    brand_other: brandOther,
    sleeve: parsed.request.sleeve?.trim().toLowerCase() || null,
  };

  if (parsed.intent === "decline") {
    return {
      ...parsed,
      request,
      missing: [],
      decline_reason: parsed.decline_reason ?? "rules",
    };
  }

  const missing = new Set<MissingField>();

  if (request.budget_max_inr === null) {
    missing.add("budget");
  }

  const hasCategorySignal =
    request.categories.length > 0 ||
    request.use_tags.length > 0 ||
    request.pattern_include.length > 0 ||
    request.fit_include.length > 0 ||
    request.colours_include.length > 0 ||
    request.weather !== null;

  if (!hasCategorySignal) {
    missing.add("category");
  }

  return {
    ...parsed,
    intent: missing.size > 0 ? "clarify" : "recommend",
    request,
    missing: [...missing],
    decline_reason: null,
  };
}

export type ParseOptions = {
  readonly timeoutMs?: number;
};

export async function parseRequest(
  message: string,
  sessionId: string,
  chat: ChatFn,
  options: ParseOptions = {},
): Promise<ParsedRequest> {
  const result = await requestJson(
    {
      agent: "parser",
      system: PARSER_SYSTEM,
      user: parserUser(message),
      schema: parsedRequestSchema,
      sessionId,
      maxTokens: MAX_OUTPUT_TOKENS,
      timeoutMs: options.timeoutMs ?? PARSER_TIMEOUT_MS,
      temperature: 0.1,
      reasoningEffort: "none",
    },
    chat,
  );

  return normalizeParsed(result.data);
}
