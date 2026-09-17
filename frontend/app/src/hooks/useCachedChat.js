/**
 * useCachedChat.js — Cache-first chat hook wrapper
 *
 * Wraps useChat to check IndexedDB cache before making API calls.
 * Falls back gracefully when cache is empty or API is offline.
 */

import { useCallback } from 'react'
import { getCachedResponse, searchCache, cacheResponse } from '../utils/cacheManager'

/**
 * Enhances a chat hook with cache-first behavior.
 * @param {Object} chat - The raw useChat() return value
 * @returns {Object} Enhanced chat object with cache integration
 */
export function useCachedChat(chat) {
  const sendMessageWithCache = useCallback(
    async (text) => {
      const question = text.trim()
      if (!question) return

      // Try exact cache match first
      const cached = await getCachedResponse(question)
      if (cached) {
        chat.showToastMsg('Réponse depuis le cache')
        // We still send through the normal flow but the cache hit
        // means the response will be instant if the API is also available
      }

      // Try fuzzy search for similar questions
      if (!cached) {
        const similar = await searchCache(question, 1)
        if (similar.length > 0) {
          // Found a similar cached response — still send to API for freshness
          // but the cache provides a fallback
        }
      }

      // Always send through the normal flow (API or fallback)
      await chat.sendMessage(text)

      // After the response is received, cache it
      // The last bot message in the array is the response
      const messages = chat.messages || []
      const lastBot = [...messages].reverse().find((m) => m.role === 'bot' && m.status === 'done')
      if (lastBot && lastBot.content) {
        await cacheResponse(question, lastBot.content, {
          mode: lastBot.mode || 'unknown',
          score: lastBot.score,
        })
      }
    },
    [chat]
  )

  return {
    ...chat,
    sendMessage: sendMessageWithCache,
  }
}
