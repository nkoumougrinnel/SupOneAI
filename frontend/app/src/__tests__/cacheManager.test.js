/**
 * cacheManager.test.js — Tests for IndexedDB LRU cache
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  cacheResponse,
  getCachedResponse,
  searchCache,
  clearCache,
  getCacheStats,
} from '../utils/cacheManager'

describe('cacheManager', () => {
  beforeEach(async () => {
    await clearCache()
  })

  it('should cache and retrieve a response', async () => {
    await cacheResponse('What is SUP?', 'SUP is a school', { mode: 'faq' })

    const result = await getCachedResponse('What is SUP?')
    expect(result).not.toBeNull()
    expect(result.answer).toBe('SUP is a school')
    expect(result.mode).toBe('faq')
    expect(result.cached).toBe(true)
  })

  it('should return null for non-existent cache entry', async () => {
    const result = await getCachedResponse('nonexistent question')
    expect(result).toBeNull()
  })

  it('should find similar questions via fuzzy search', async () => {
    await cacheResponse('What are the admission requirements?', 'Requirements include...', { mode: 'faq' })

    const results = await searchCache('admission requirements')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].answer).toBe('Requirements include...')
  })

  it('should return empty array for no matches', async () => {
    const results = await searchCache('completely unrelated')
    expect(results).toEqual([])
  })

  it('should track cache stats', async () => {
    const initial = await getCacheStats()
    expect(initial.count).toBe(0)

    await cacheResponse('Q1', 'A1')
    await cacheResponse('Q2', 'A2')

    const after = await getCacheStats()
    expect(after.count).toBe(2)
  })

  it('should clear cache', async () => {
    await cacheResponse('Q1', 'A1')
    await clearCache()

    const result = await getCachedResponse('Q1')
    expect(result).toBeNull()
  })

  it('should normalize questions for consistent keys', async () => {
    await cacheResponse('What is SUP?', 'Answer 1')
    await cacheResponse('what is sup?', 'Answer 2')

    // Second write should overwrite first (same normalized key)
    const stats = await getCacheStats()
    expect(stats.count).toBe(1)
  })
})
