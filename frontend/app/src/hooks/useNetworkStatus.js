/**
 * useNetworkStatus.js — Network connectivity detection hook
 *
 * Uses @capacitor/network to detect online/offline status and connection type.
 * Stores status in state for UI warnings and message queue management.
 */

import { useEffect, useState, useCallback } from 'react'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Hook to track network connectivity status.
 * @returns {Object} Network status and helpers
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    connected: navigator.onLine,
    connectionType: 'unknown',
    isOnline: navigator.onLine,
  })

  const [offlineQueue, setOfflineQueue] = useState([])

  // Check current status
  const checkStatus = useCallback(async () => {
    if (isNative) {
      try {
        const result = await Network.getStatus()
        setStatus({
          connected: result.connected,
          connectionType: result.connectionType,
          isOnline: result.connected,
        })
        return result.connected
      } catch {
        setStatus((prev) => ({ ...prev, connected: false, isOnline: false }))
        return false
      }
    }

    // Browser fallback
    const online = navigator.onLine
    setStatus({
      connected: online,
      connectionType: online ? 'wifi' : 'none',
      isOnline: online,
    })
    return online
  }, [])

  // Add a message to the offline queue
  const queueMessage = useCallback((message) => {
    setOfflineQueue((prev) => [...prev, { ...message, queuedAt: Date.now() }])
  }, [])

  // Clear the offline queue (after sync)
  const clearQueue = useCallback(() => {
    setOfflineQueue([])
  }, [])

  // Remove a specific message from the queue
  const removeFromQueue = useCallback((messageId) => {
    setOfflineQueue((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  // Get queued messages count
  const queueCount = offlineQueue.length

  useEffect(() => {
    // Initial check
    checkStatus()

    if (isNative) {
      // Native: use Capacitor Network listener
      const listener = Network.addListener('networkStatusChange', (result) => {
        setStatus({
          connected: result.connected,
          connectionType: result.connectionType,
          isOnline: result.connected,
        })
      })

      return () => {
        listener.then((l) => l.remove())
      }
    } else {
      // Browser: use online/offline events
      const handleOnline = () => {
        setStatus({
          connected: true,
          connectionType: 'wifi',
          isOnline: true,
        })
      }

      const handleOffline = () => {
        setStatus({
          connected: false,
          connectionType: 'none',
          isOnline: false,
        })
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [checkStatus])

  return {
    ...status,
    checkStatus,
    queueMessage,
    clearQueue,
    removeFromQueue,
    offlineQueue,
    queueCount,
  }
}
