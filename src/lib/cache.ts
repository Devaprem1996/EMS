type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class MemoryCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates any cached keys that match a pattern.
   * Useful for clearing all job-related lists (e.g. key pattern: /^jobs:/) when any ticket changes.
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Single global instance on the server side
export const serverCache = new MemoryCache();

/**
 * Invalidates both jobs (enquiries/tickets) lists and tasks (technician dispatches) caches.
 * Should be called after any mutative write to tickets, assignments, or statuses.
 */
export function invalidateJobsAndTasks(): void {
  serverCache.invalidatePattern(/^jobs:/);
  serverCache.invalidatePattern(/^tasks:/);
}

