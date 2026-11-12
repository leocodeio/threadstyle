export const MODELS = {
  parser: "deepseek-v4.1-flash",
  picker: "deepseek-v4.1-flash",
  judge: "deepseek-v4.1-flash",
} as const;

export type AgentName = keyof typeof MODELS;

export const DEFAULT_BASE_URL = "https://opencode.ai/inference/go/openai/v1";
export const MAX_REQUEST_CHARS = 300;
export const MAX_ITEMS = 3;
export const MAX_CANDIDATES = 6;
export const MAX_OUTPUT_TOKENS = 600;
export const REQUEST_DEADLINE_MS = 22_000;
export const PARSER_TIMEOUT_MS = 9_000;
export const PICKER_TIMEOUT_MS = 13_000;
export const PICKER_RETRY_TIMEOUT_MS = 7_000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;
