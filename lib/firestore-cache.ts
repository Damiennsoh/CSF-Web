// Safe Firestore Cache with Timeout Protection
// Reduces read quota by caching frequently accessed data

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const CACHE = new Map<string, CacheEntry<any>>()
const PENDING_PROMISES = new Map<string, Promise<any>>()

/**
 * Helper to prevent infinite hangs
 */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Fetch timeout after ${ms}ms`)), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

/**
 * Get data from cache or fetch from Firestore with deduplication and timeout protection
 * @param key - Unique cache key
 * @param fetcher - Async function to fetch data if not cached
 * @param ttlMs - Time to live in milliseconds (default: 30 minutes)
 * @returns Cached or fetched data
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 30 * 60 * 1000 // 30 minutes default
): Promise<T> {
  const cached = CACHE.get(key)
  
  // 1. Valid Cache Hit
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`[Cache HIT] ${key}`)
    return cached.data
  }
  
  // 2. Prevent Request Collisions (Deduplication)
  if (PENDING_PROMISES.has(key)) {
    console.log(`[Cache PENDING] ${key} - waiting for existing request`)
    try {
      return await PENDING_PROMISES.get(key)
    } catch (e) {
      // If the pending one failed, fall through to retry
    }
  }
  
  // 3. Fetch fresh data with a 10s safety timeout
  console.log(`[Cache MISS] ${key} - fetching fresh data`)
  const fetchPromise = (async () => {
    try {
      const data = await withTimeout(fetcher(), 10000); // 10s limit
      
      // Store in cache
      CACHE.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      })
      
      return data
    } catch (error) {
      console.error(`[Cache Error] ${key}:`, error)
      
      // Return stale cache if available
      if (cached) {
        console.log(`[Cache FALLBACK] Using stale data for ${key}`)
        return cached.data
      }
      
      throw error
    } finally {
      // Always clean up pending promise
      PENDING_PROMISES.delete(key)
    }
  })()
  
  PENDING_PROMISES.set(key, fetchPromise)
  return fetchPromise
}

/**
 * Invalidate cache entry
 * @param key - Cache key to invalidate, or undefined to clear all
 */
export function invalidateCache(key?: string) {
  if (key) {
    CACHE.delete(key)
    console.log(`[Cache CLEARED] ${key}`)
  } else {
    CACHE.clear()
    console.log(`[Cache CLEARED] All cache entries`)
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  const stats = {
    totalEntries: CACHE.size,
    entries: Array.from(CACHE.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      expired: Date.now() - entry.timestamp >= entry.ttl,
    })),
  }
  return stats
}

/**
 * Predefined cache TTLs for different data types
 */
export const CACHE_TTL = {
  HOMEPAGE_SECTIONS: 30 * 60 * 1000, // 30 minutes - homepage sections (ministries, events, etc)
  ADMIN_STATS: 5 * 60 * 1000, // 5 minutes - admin dashboard stats
  NAVIGATION: 60 * 60 * 1000, // 1 hour - navigation menus
  USER_PROFILE: 15 * 60 * 1000, // 15 minutes - user profile data
  TEMPORARY: 5 * 60 * 1000, // 5 minutes - temporary data
} as const

/**
 * Cache keys used throughout the app
 */
export const CACHE_KEYS = {
  MINISTRIES: "ministries:active",
  EVENTS: "events:featured",
  RESOURCES: "resources:featured",
  LEADERSHIP: "leadership:all",
  ALUMNI: "alumni:featured",
  TESTIMONIALS: "testimonials:featured",
  GALLERY: "gallery:all",
  ADMIN_STATS: "admin:stats",
  NAVIGATION_MINISTRIES: "nav:ministries",
  PRAYER_REQUESTS: "prayer:requests",
} as const
