/**
 * cacheManager.js — IndexedDB LRU cache for chat responses
 *
 * Uses the `idb` library for a clean async IndexedDB API.
 * Stores up to MAX_MESSAGES entries with LRU eviction.
 */

import { openDB } from 'idb'

const DB_NAME = 'supone-cache'
const DB_VERSION = 1
const STORE_NAME = 'chat-responses'
const MAX_MESSAGES = 100
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('question', 'question', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      },
    })
  }
  return dbPromise
}

/**
 * Normalize a question for cache key generation.
 * Lowercases, trims, removes punctuation, and collapses whitespace.
 */
function normalizeQuestion(q) {
  return q
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:…«»"'()]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Generate a simple hash for the normalized question.
 */
function hashQuestion(normalized) {
  let hash = 0
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return `q_${Math.abs(hash).toString(36)}`
}

/**
 * Store a question/answer pair in the cache.
 */
export async function cacheResponse(question, answer, meta = {}) {
  try {
    const db = await getDB()
    const normalized = normalizeQuestion(question)
    const id = hashQuestion(normalized)

    const entry = {
      id,
      question: normalized,
      originalQuestion: question,
      answer,
      timestamp: Date.now(),
      ttl: meta.ttl || DEFAULT_TTL_MS,
      mode: meta.mode || 'unknown',
      score: meta.score ?? null,
    }

    await db.put(STORE_NAME, entry)

    // LRU eviction: if store exceeds MAX_MESSAGES, remove oldest
    const count = await db.count(STORE_NAME)
    if (count > MAX_MESSAGES) {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const toDelete = count - MAX_MESSAGES

      let deleted = 0
      let cursor = await index.openCursor()
      while (cursor && deleted < toDelete) {
        cursor.delete()
        deleted++
        cursor = await cursor.continue()
      }
      await tx.done
    }
  } catch {
    // IndexedDB unavailable or quota exceeded — silent fail
  }
}

/**
 * Retrieve a cached response for a question (exact match).
 * Returns null if not found or expired.
 */
export async function getCachedResponse(question) {
  try {
    const db = await getDB()
    const normalized = normalizeQuestion(question)
    const id = hashQuestion(normalized)

    const entry = await db.get(STORE_NAME, id)
    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      await db.delete(STORE_NAME, id)
      return null
    }

    return {
      answer: entry.answer,
      mode: entry.mode,
      score: entry.score,
      cached: true,
      cachedAt: entry.timestamp,
    }
  } catch {
    return null
  }
}

/**
 * Search cache with fuzzy matching (substring match on normalized question).
 * Returns up to `limit` results sorted by relevance (newest first).
 */
export async function searchCache(question, limit = 3) {
  try {
    const db = await getDB()
    const normalized = normalizeQuestion(question)

    const allEntries = await db.getAll(STORE_NAME)
    const now = Date.now()

    const matches = allEntries
      .filter((e) => now - e.timestamp <= e.ttl)
      .filter((e) => e.question.includes(normalized) || normalized.includes(e.question))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)

    return matches.map((e) => ({
      answer: e.answer,
      mode: e.mode,
      score: e.score,
      question: e.originalQuestion,
      cached: true,
      cachedAt: e.timestamp,
    }))
  } catch {
    return []
  }
}

/**
 * Clear all cached responses.
 */
export async function clearCache() {
  try {
    const db = await getDB()
    await db.clear(STORE_NAME)
  } catch {
    // silent
  }
}

/**
 * Get cache statistics.
 */
export async function getCacheStats() {
  try {
    const db = await getDB()
    const count = await db.count(STORE_NAME)
    return { count, maxSize: MAX_MESSAGES }
  } catch {
    return { count: 0, maxSize: MAX_MESSAGES }
  }
}
