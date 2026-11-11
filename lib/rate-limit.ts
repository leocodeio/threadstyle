import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./config";

export type RateLimitResult = {
  readonly allowed: boolean;
  readonly retryAfter: number;
};

// Best-effort per-instance limiter. Vercel may run several instances.
const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  const recent = (buckets.get(key) ?? []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = recent[0] ?? now;
    const retryAfter = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1_000),
    );
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > 1_000) {
    for (const [bucketKey, times] of buckets) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) {
        buckets.delete(bucketKey);
      }
    }
  }

  return { allowed: true, retryAfter: 0 };
}
