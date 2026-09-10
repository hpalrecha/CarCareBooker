/**
 * Fixed-window rate limiting for public endpoints.
 *
 * WHY THIS EXISTS. POST /api/ppf-leads and POST /api/bookings are unauthenticated, write
 * to the database, and (for bookings) trigger a WhatsApp message and an ERP sync. Before
 * this there was no limit of any kind anywhere in the server — grepping for
 * `rate.?limit|helmet|csrf|captcha` returned two unrelated comments. A trivial script
 * could fill the leads table faster than staff could read it, and these endpoints are
 * about to be pointed at from paid advertising, which is exactly when they get found.
 *
 * WHY IN-MEMORY, AND WHAT THAT COSTS. No new dependency, and nothing to operate. The
 * tradeoff is real and worth stating plainly: counters live in one process, so two
 * containers would each allow the full quota. This deployment runs a single container, so
 * today the limit is the limit. If it is ever scaled out, this needs to move to Postgres
 * or Redis — a comment at the call site says so too.
 *
 * WHY FIXED WINDOW rather than a token bucket or sliding log: a burst at a window
 * boundary can pass up to 2x the quota. For abuse control on a booking form that is
 * irrelevant, and the simpler algorithm is one that can be read and trusted at a glance.
 *
 * FAILS OPEN, deliberately. If anything in here throws, the request proceeds. A bug in
 * spam control must not be able to take down booking — losing a real customer costs more
 * than admitting a spam row.
 */

import type { Request, Response, NextFunction } from "express";

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests permitted per key per window. */
  max: number;
  /** Message returned once the quota is spent. */
  message?: string;
  /**
   * Groups counters that must not share a quota. Two limiters with the same bucket would
   * decrement each other's budget, so each endpoint passes its own.
   */
  bucket: string;
}

interface Counter {
  count: number;
  /** Epoch ms at which this window ends and the count resets. */
  resetAt: number;
}

const counters = new Map<string, Counter>();

/**
 * Drop expired counters so the map cannot grow without bound.
 *
 * Called opportunistically on write rather than on a timer: an interval would keep the
 * event loop alive and has to be torn down in tests, and there is no work to do when no
 * requests are arriving anyway.
 */
function sweep(now: number): void {
  if (counters.size < 5000) return;
  // Array.from rather than iterating the Map directly: the tsconfig target predates
  // downlevelIteration, so a for..of over a Map does not compile here. Same constraint
  // already worked around in client/src/lib/local-business.ts.
  for (const [key, counter] of Array.from(counters.entries())) {
    if (counter.resetAt <= now) counters.delete(key);
  }
}

/**
 * The client identity a quota is charged against.
 *
 * `trust proxy` is set (the app runs behind Cloudflare), so req.ip is already the
 * client address rather than the proxy's. Falling back to a single shared key would put
 * every visitor in one bucket and rate-limit the whole site the moment one person is
 * busy, so an unknown address gets its own key instead and is effectively unlimited —
 * failing open, consistent with the rest of this module.
 */
function clientKey(req: Request): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** Current state for a key without consuming quota. Exported for tests. */
export function inspect(bucket: string, key: string): Counter | undefined {
  return counters.get(`${bucket}:${key}`);
}

/** Clear all counters. Test-only, and used between cases so quotas do not leak. */
export function __resetRateLimitsForTests(): void {
  counters.clear();
}

/**
 * Consume one unit of quota. Returns whether the request is allowed, plus the headers
 * describing the remaining budget.
 *
 * Separated from the middleware so the decision is unit-testable without an Express
 * request/response pair.
 */
export function consume(
  options: RateLimitOptions,
  key: string,
  now: number = Date.now(),
): { allowed: boolean; remaining: number; resetAt: number; retryAfterSeconds: number } {
  const mapKey = `${options.bucket}:${key}`;
  sweep(now);

  let counter = counters.get(mapKey);
  if (!counter || counter.resetAt <= now) {
    counter = { count: 0, resetAt: now + options.windowMs };
    counters.set(mapKey, counter);
  }

  counter.count += 1;

  const allowed = counter.count <= options.max;
  return {
    allowed,
    remaining: Math.max(0, options.max - counter.count),
    resetAt: counter.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((counter.resetAt - now) / 1000)),
  };
}

/** Express middleware wrapping `consume`. */
export function rateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = consume(options, clientKey(req));

      res.setHeader("RateLimit-Limit", String(options.max));
      res.setHeader("RateLimit-Remaining", String(result.remaining));
      res.setHeader("RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

      if (result.allowed) return next();

      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      // 429 with a human message: this endpoint is called by a real form, and a customer
      // who double-taps deserves an explanation rather than a bare status code.
      return res.status(429).json({
        message:
          options.message ??
          "Too many requests. Please wait a moment and try again, or call us to book directly.",
      });
    } catch (error) {
      // Fails open — see the header comment.
      console.error("[rate-limit] failed open:", error);
      return next();
    }
  };
}
