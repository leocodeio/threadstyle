import { NextResponse } from "next/server";

import { LlmError } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";
import { recommend } from "@/lib/recommend";
import { recommendRequestSchema } from "@/lib/recommend-types";

export const maxDuration = 60;

type ApiError = {
  readonly state: "error";
  readonly message: string;
};

function errorResponse(message: string, status: number): NextResponse<ApiError> {
  return NextResponse.json(
    { state: "error", message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const started = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Send a JSON body with a message.", 400);
    }
    throw error;
  }

  const input = recommendRequestSchema.safeParse(body);
  if (!input.success) {
    return errorResponse(
      "Keep the request between 3 and 300 characters.",
      400,
    );
  }

  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    const response = errorResponse(
      "Too many requests. Give it a minute.",
      429,
    );
    response.headers.set("retry-after", String(limit.retryAfter));
    return response;
  }

  if (!process.env.OPENCODE_API_KEY) {
    console.error("OPENCODE_API_KEY is not set");
    return errorResponse("The stylist is offline. Try again later.", 503);
  }

  try {
    const result = await recommend(input.data.message, {
      sessionId: input.data.session_id,
      prior: input.data.prior ?? null,
    });

    console.info(
      JSON.stringify({
        event: "recommend",
        request_id: result.meta.request_id,
        state: result.state,
        items: result.items.length,
        filtered: result.meta.filtered,
        relaxed: result.meta.relaxed,
        latency_ms: Date.now() - started,
      }),
    );

    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof LlmError) {
      console.error(
        JSON.stringify({
          event: "recommend_error",
          kind: error.kind,
          status: error.status,
          message: error.message,
        }),
      );

      if (error.kind === "auth") {
        return errorResponse("The stylist is offline. Check the API key.", 503);
      }
      if (error.kind === "rate") {
        return errorResponse("The model is busy. Try again in a minute.", 429);
      }
      return errorResponse("The stylist didn't answer. Try again.", 502);
    }

    console.error("recommend failed", error);
    return errorResponse("Something broke on our side. Try again.", 500);
  }
}
