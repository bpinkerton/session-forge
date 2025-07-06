import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestCache } from '@/utils/requestCache'

describe('RequestCache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    requestCache.clear()
    vi.clearAllMocks()
  })

  it('should cache successful requests', async () => {
    const mockFetcher = vi.fn().mockResolvedValue('test-data')
    
    // First call should execute the fetcher
    const result1 = await requestCache.get('test-key', mockFetcher)
    expect(result1).toBe('test-data')
    expect(mockFetcher).toHaveBeenCalledTimes(1)
    
    // Second call should return cached data
    const result2 = await requestCache.get('test-key', mockFetcher)
    expect(result2).toBe('test-data')
    expect(mockFetcher).toHaveBeenCalledTimes(1) // Not called again
  })

  it('should not cache failed requests', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('API Error'))
    
    // First call should fail
    await expect(requestCache.get('test-key', mockFetcher)).rejects.toThrow('API Error')
    expect(mockFetcher).toHaveBeenCalledTimes(1)
    
    // Second call should try again since error wasn't cached
    await expect(requestCache.get('test-key', mockFetcher)).rejects.toThrow('API Error')
    expect(mockFetcher).toHaveBeenCalledTimes(2)
  })

  it('should expire cache after TTL', async () => {
    const mockFetcher = vi.fn()
      .mockResolvedValueOnce('first-data')
      .mockResolvedValueOnce('second-data')
    
    // First call
    const result1 = await requestCache.get('test-key', mockFetcher)
    expect(result1).toBe('first-data')
    
    // Mock time passing beyond TTL
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000) // 6 minutes
    
    // Second call should fetch fresh data
    const result2 = await requestCache.get('test-key', mockFetcher)
    expect(result2).toBe('second-data')
    expect(mockFetcher).toHaveBeenCalledTimes(2)
  })

  it('should handle concurrent requests for the same key', async () => {
    const mockFetcher = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('test-data'), 100))
    )
    
    // Start multiple concurrent requests
    const promises = [
      requestCache.get('test-key', mockFetcher),
      requestCache.get('test-key', mockFetcher),
      requestCache.get('test-key', mockFetcher)
    ]
    
    const results = await Promise.all(promises)
    
    // All should return the same data
    expect(results).toEqual(['test-data', 'test-data', 'test-data'])
    // But fetcher should only be called once
    expect(mockFetcher).toHaveBeenCalledTimes(1)
  })

  it('should handle different cache keys separately', async () => {
    const mockFetcher1 = vi.fn().mockResolvedValue('data-1')
    const mockFetcher2 = vi.fn().mockResolvedValue('data-2')
    
    const result1 = await requestCache.get('key-1', mockFetcher1)
    const result2 = await requestCache.get('key-2', mockFetcher2)
    
    expect(result1).toBe('data-1')
    expect(result2).toBe('data-2')
    expect(mockFetcher1).toHaveBeenCalledTimes(1)
    expect(mockFetcher2).toHaveBeenCalledTimes(1)
  })

  it('should clear cache correctly', async () => {
    const mockFetcher = vi.fn().mockResolvedValue('test-data')
    
    // Cache some data
    await requestCache.get('test-key', mockFetcher)
    expect(mockFetcher).toHaveBeenCalledTimes(1)
    
    // Clear cache
    requestCache.clear()
    
    // Next call should fetch fresh data
    await requestCache.get('test-key', mockFetcher)
    expect(mockFetcher).toHaveBeenCalledTimes(2)
  })
})