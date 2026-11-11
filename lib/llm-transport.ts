import { DEFAULT_BASE_URL, MODELS, type AgentName } from "./config";

export type LlmErrorKind = "auth" | "rate" | "timeout" | "http" | "parse";

export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly status: number | null;

  constructor(kind: LlmErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "LlmError";
    this.kind = kind;
    this.status = status;
  }
}

export type ChatUsage = {
  readonly prompt_tokens?: number;
  readonly completion_tokens?: number;
  readonly total_tokens?: number;
};

export type ChatMessage = {
  readonly role: "system" | "user";
  readonly content: string;
};

export type ChatCompletionRequest = {
  readonly agent: AgentName;
  readonly messages: readonly ChatMessage[];
  readonly sessionId: string;
  readonly timeoutMs: number;
  readonly maxTokens: number;
  readonly temperature: number;
};

export type ChatCompletionResult = {
  readonly text: string;
  readonly usage: ChatUsage | null;
  readonly latencyMs: number;
};

export type ChatFn = (
  request: ChatCompletionRequest,
) => Promise<ChatCompletionResult>;

function baseUrl(): string {
  return (
    process.env.OPENCODE_BASE_URL?.replace(/\/+$/, "") ?? DEFAULT_BASE_URL
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function responseError(response: Response): Promise<LlmError> {
  const body = await response.text().catch(() => "");
  const message = `OpenCode ${response.status}: ${body.slice(0, 300) || response.statusText}`;

  if (response.status === 401 || response.status === 403) {
    return new LlmError("auth", message, response.status);
  }
  if (response.status === 429) {
    return new LlmError("rate", message, response.status);
  }
  return new LlmError("http", message, response.status);
}

async function fetchOnce(request: ChatCompletionRequest): Promise<Response> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) {
    throw new LlmError("auth", "OPENCODE_API_KEY is not set");
  }

  try {
    return await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "user-agent": "thread-mvp/1.0",
        "x-opencode-session": request.sessionId,
      },
      body: JSON.stringify({
        model: MODELS[request.agent],
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new LlmError("timeout", "The model call timed out");
    }
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new LlmError("http", `The model call failed before a response${detail}`);
  }
}

async function fetchWithRetry(
  request: ChatCompletionRequest,
): Promise<Response> {
  const first = await fetchOnce(request);
  if (first.ok) return first;

  if (first.status === 429 || first.status >= 500) {
    await sleep(500);
    const second = await fetchOnce(request);
    if (second.ok) return second;
    throw await responseError(second);
  }

  throw await responseError(first);
}

export async function chatCompletion(
  request: ChatCompletionRequest,
): Promise<ChatCompletionResult> {
  const started = Date.now();
  const response = await fetchWithRetry(request);
  const payload: unknown = await response.json();

  if (!isRecord(payload)) {
    throw new LlmError("parse", "The model response was not an object");
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmError("parse", "The model response had no choices");
  }

  const first: unknown = choices[0];
  const message = isRecord(first) ? first.message : null;
  const text =
    isRecord(message) && typeof message.content === "string"
      ? message.content
      : null;

  if (!text) {
    throw new LlmError("parse", "The model response had no text");
  }

  const usage = isRecord(payload.usage)
    ? {
        prompt_tokens: numberOrUndefined(payload.usage.prompt_tokens),
        completion_tokens: numberOrUndefined(payload.usage.completion_tokens),
        total_tokens: numberOrUndefined(payload.usage.total_tokens),
      }
    : null;

  return { text, usage, latencyMs: Date.now() - started };
}
