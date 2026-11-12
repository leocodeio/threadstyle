import { z } from "zod";

import {
  CATEGORIES,
  USE_TAGS,
  type CatalogueItem,
  type Category,
  type UseTag,
} from "./catalogue";
import { MAX_REQUEST_CHARS } from "./config";

const missingFieldSchema = z.enum(["category", "budget"]);

export const parsedRequestSchema = z.object({
  intent: z.enum(["recommend", "clarify", "decline"]),
  language: z.enum(["en", "hinglish"]),
  references_prior: z.boolean(),
  missing: z.array(missingFieldSchema).max(2),
  decline_reason: z.enum(["body", "size", "order", "rules"]).nullable(),
  request: z.object({
    categories: z.array(z.enum(CATEGORIES)).max(8),
    budget_max_inr: z.number().int().positive().nullable(),
    audience: z.enum(["men", "women"]).nullable(),
    colours_include: z.array(z.string()).max(8),
    colours_exclude: z.array(z.string()).max(8),
    colour_tone: z.enum(["dark", "light"]).nullable(),
    fabric_include: z.array(z.string()).max(8),
    brand_other: z.string().nullable(),
    weather: z.enum(["hot_humid", "mild", "cold"]).nullable(),
    formality_min: z.number().int().min(1).max(3).nullable(),
    upkeep: z.literal("easy").nullable(),
    fit_include: z.array(z.string()).max(8),
    pattern_include: z.array(z.string()).max(8),
    use_tags: z.array(z.enum(USE_TAGS)).max(8),
    sleeve: z.string().nullable(),
    sort: z.enum(["cheapest", "best_rated", "balanced"]),
    wants_count: z.number().int().min(1).max(3).nullable(),
  }),
});

export type ParsedRequest = z.infer<typeof parsedRequestSchema>;
export type ParsedNeed = ParsedRequest["request"];
export type MissingField = z.infer<typeof missingFieldSchema>;
export type DeclineReason = NonNullable<ParsedRequest["decline_reason"]>;
export type Language = ParsedRequest["language"];

export const priorRequestSchema = z.object({
  request: parsedRequestSchema.shape.request,
  missing: z.array(missingFieldSchema).max(2),
  last_message: z.string().trim().max(MAX_REQUEST_CHARS).optional(),
});

export type PriorRequest = z.infer<typeof priorRequestSchema>;

export const pickerOutputSchema = z.object({
  message: z.string().min(1).max(240),
  items: z
    .array(
      z.object({
        item_id: z.string().min(1),
        why: z.string().min(1).max(400),
        trade_off: z.string().min(1).max(240),
      }),
    )
    .max(5),
});

export type PickerOutput = z.infer<typeof pickerOutputSchema>;

export const recommendRequestSchema = z.object({
  message: z.string().trim().min(3).max(MAX_REQUEST_CHARS),
  session_id: z
    .string()
    .trim()
    .min(8)
    .max(120)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  prior: priorRequestSchema.optional(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;

export const recommendStateSchema = z.enum([
  "recommend",
  "clarify",
  "decline",
  "no_match",
  "error",
]);

export type RecommendState = z.infer<typeof recommendStateSchema>;

export type RecommendedItem = {
  readonly item: CatalogueItem;
  readonly why: string;
  readonly trade_off: string;
};

export type RecommendMeta = {
  readonly request_id: string;
  readonly filtered: number;
  readonly relaxed: readonly string[];
  readonly latency_ms: number;
  readonly prior: PriorRequest | null;
};

export type RecommendResponse = {
  readonly state: RecommendState;
  readonly message: string;
  readonly items: readonly RecommendedItem[];
  readonly meta: RecommendMeta;
};

export type CategoryFilter = {
  readonly categories: readonly Category[];
};

export type UseTagFilter = {
  readonly use_tags: readonly UseTag[];
};
