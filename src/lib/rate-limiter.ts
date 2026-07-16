import { serverCache } from "./cache";

export interface RateLimitResult {
  isLimited: boolean;
  remaining: number;
  reset: number;
}

/**
 * Checks if a request from a given client IP address exceeds the rate limit.
 * Defaults to a limit of 100 requests per minute.
 * 
 * @param ip Client IP address
 * @param limit Max number of allowed requests in the window
 * @param windowMs Time window in milliseconds (default: 60000ms = 1 minute)
 */
export function rateLimit(ip: string, limit = 100, windowMs = 60000): RateLimitResult {
  const cacheKey = `ratelimit:${ip}`;
  const now = Date.now();
  
  let entry = serverCache.get<{ count: number; expiresAt: number }>(cacheKey);
  
  if (!entry || now > entry.expiresAt) {
    // New window or expired window, initialize entry
    entry = {
      count: 1,
      expiresAt: now + windowMs,
    };
  } else {
    // Inside existing window, increment count
    entry.count += 1;
  }
  
  // Set in cache with time-to-live matching the remaining time in window
  const remainingTime = Math.max(0, entry.expiresAt - now);
  serverCache.set(cacheKey, entry, remainingTime);
  
  const isLimited = entry.count > limit;
  const remaining = Math.max(0, limit - entry.count);
  const reset = entry.expiresAt;
  
  return {
    isLimited,
    remaining,
    reset,
  };
}
