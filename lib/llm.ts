import { z } from "zod";

import type { AgentName } from "./config";
import {
  chatCompletion,
  LlmError,
  type ChatCompletionResult,
  type ChatFn,
  type ChatUsage,
  type ReasoningEffort,
} from "./llm-transport";

export {
  chatCompletion,
  LlmError,
} from "./llm-transport";
export type {
  ChatCompletionRequest,
  ChatCompletionResult,
  ChatFn,
  ChatMessage,
  ChatUsage,
  LlmErrorKind,
} from "./llm-transport";

export type JsonRequest<T> = {
  readonly agent: AgentName;
  readonly system: string;
  readonly user: string;
  readonly schema: z.ZodType<T>;
  readonly sessionId: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly timeoutMs?: number;
  readonly reasoningEffort?: ReasoningEffort;
};

export type JsonResult<T> = {
  readonly data: T;
  readonly usage: ChatUsage | null;
  readonly latencyMs: number;
};

type JsonParse =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false };

function parseJsonLoose(text: string): JsonParse {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false };

  try {
    const value: unknown = JSON.parse(stripped.slice(start, end + 1));
    return { ok: true, value };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false };
    throw error;
  }
}

function issues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

async function repairJson<T>(
  request: JsonRequest<T>,
  chat: ChatFn,
  first: ChatCompletionResult,
  validationError: string,
): Promise<JsonResult<T>> {
  const repaired = await chat({
    agent: request.agent,
    messages: [
      { role: "system", content: request.system },
      {
        role: "user",
        content: [
          "Your previous output was not valid for the required schema.",
          "Original request:",
          request.user,
          "",
          "Previous output:",
          truncate(first.text, 1_200),
          "",
          "Validation error:",
          validationError,
          "",
          "Return only corrected JSON.",
        ].join("\n"),
      },
    ],
    sessionId: request.sessionId,
    timeoutMs: request.timeoutMs ?? 15_000,
    maxTokens: request.maxTokens ?? 1_500,
    temperature: 0,
    reasoningEffort: "none",
  });

  const parsed = parseJsonLoose(repaired.text);
  if (!parsed.ok) {
    throw new LlmError("parse", "The model returned invalid JSON twice");
  }

  const result = request.schema.safeParse(parsed.value);
  if (!result.success) {
    throw new LlmError(
      "parse",
      `The model returned invalid JSON twice: ${issues(result.error)}`,
    );
  }

  return {
    data: result.data,
    usage: repaired.usage,
    latencyMs: first.latencyMs + repaired.latencyMs,
  };
}

export async function requestJson<T>(
  request: JsonRequest<T>,
  chat: ChatFn = chatCompletion,
): Promise<JsonResult<T>> {
  const first = await chat({
    agent: request.agent,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
    sessionId: request.sessionId,
    timeoutMs: request.timeoutMs ?? 15_000,
    maxTokens: request.maxTokens ?? 1_500,
    temperature: request.temperature ?? 0.1,
    reasoningEffort: request.reasoningEffort,
  });

  const parsed = parseJsonLoose(first.text);
  if (!parsed.ok) {
    return repairJson(request, chat, first, "The output was not valid JSON.");
  }

  const result = request.schema.safeParse(parsed.value);
  if (result.success) {
    return { data: result.data, usage: first.usage, latencyMs: first.latencyMs };
  }

  return repairJson(request, chat, first, issues(result.error));
}
