// Simple in-memory cache for API responses
class DataCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time-to-live for cache entries
  }

  set(key, value, ttlMs = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  get(key) {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Cache key generators - simple string constants
  static COMMUNITIES_KEY = 'communities';
  static USER_KEY = (userId) => `user_${userId}`;
  static POSTS_KEY = (communityId) => `posts_${communityId}`;
  static GYMS_KEY = 'gyms';
}

// Global cache instance
export const dataCache = new DataCache();

// Cache wrapper for async functions
export function withCache(cacheKey, asyncFn, ttlMs = 5 * 60 * 1000) {
  return async (...args) => {
    // Check cache first
    if (dataCache.has(cacheKey)) {
      console.log(`♻️ Cache hit for ${cacheKey}`);
      return dataCache.get(cacheKey);
    }

    // Execute function and cache result
    console.log(`🔄 Cache miss for ${cacheKey}, fetching...`);
    const result = await asyncFn(...args);
    dataCache.set(cacheKey, result, ttlMs);
    return result;
  };
}
