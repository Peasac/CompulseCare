/**
 * In-memory caching for Gemini AI responses
 * Reduces API calls and improves response time
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Cache durations by key prefix
const CACHE_DURATIONS: { [key: string]: number } = {
  'dashboard:': 60 * 60 * 1000,      // 1 hour
  'summary:': 24 * 60 * 60 * 1000,   // 24 hours
  'panic:': 5 * 60 * 1000,            // 5 minutes (panic support can change based on context)
  'targets:': 6 * 60 * 60 * 1000,    // 6 hours
  'default': 15 * 60 * 1000,         // 15 minutes default
};

function getCacheDuration(key: string): number {
  for (const [prefix, duration] of Object.entries(CACHE_DURATIONS)) {
    if (key.startsWith(prefix)) {
      return duration;
    }
  }
  return CACHE_DURATIONS.default;
}

/**
 * Get cached data if still valid
 */
export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const duration = getCacheDuration(key);
  if (Date.now() - cached.timestamp > duration) {
    cache.delete(key);
    console.log(`[Cache] Expired: ${key}`);
    return null;
  }

  console.log(`[Cache] Hit: ${key}`);
  return cached.data as T;
}

/**
 * Set cache entry
 */
export function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`[Cache] Set: ${key}`);
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  cache.delete(key);
  console.log(`[Cache] Cleared: ${key}`);
}

/**
 * Clear all cache entries for a user
 */
export function clearUserCache(userId: string): void {
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`[Cache] Cleared ${keysToDelete.length} entries for user ${userId}`);
}

/**
 * Clear all expired entries
 */
export function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of cache.entries()) {
    const duration = getCacheDuration(key);
    if (now - entry.timestamp > duration) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
  if (keysToDelete.length > 0) {
    console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupCache, 30 * 60 * 1000);
