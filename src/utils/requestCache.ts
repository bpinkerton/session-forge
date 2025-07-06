class RequestCache {
  private cache = new Map<string, { promise: Promise<unknown>, timestamp: number }>()
  private TTL = 30000 // 30 seconds cache for better UX

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)
    
    // Return cached promise if still valid
    if (cached && (now - cached.timestamp) < this.TTL) {
      return cached.promise
    }
    
    // Create new request
    const promise = fetcher()
    this.cache.set(key, { promise, timestamp: now })
    
    // Clean up cache entry after resolution
    promise.finally(() => {
      setTimeout(() => this.cache.delete(key), this.TTL)
    }).catch(() => {
      // Remove failed requests immediately
      this.cache.delete(key)
    })
    
    return promise
  }

  // Clear specific cache entry
  invalidate(key: string) {
    this.cache.delete(key)
  }

  // Clear all cache entries
  clear() {
    this.cache.clear()
  }

  // Clear cache entries matching pattern
  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

export const requestCache = new RequestCache()