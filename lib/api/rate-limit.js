const BUCKETS = new Map();

function pruneExpired(now) {
  for (const [key, bucket] of BUCKETS) {
    if (bucket.resetAt <= now) {
      BUCKETS.delete(key);
    }
  }
}

/**
 * Fixed-window limiter kept in process memory. Good enough to stop casual
 * spam on unauthenticated endpoints; it is not shared across instances.
 */
export function consumeRateLimit(key, { limit = 5, windowMs = 60 * 60 * 1000 } = {}) {
  const now = Date.now();
  if (BUCKETS.size > 5000) {
    pruneExpired(now);
  }

  const bucket = BUCKETS.get(key);
  if (!bucket || bucket.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function getRequestIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}
