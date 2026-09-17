/**
 * pushNotifications.js — Push notification management for SUP'ONE AI
 *
 * Uses @capacitor/push-notifications for Firebase Cloud Messaging.
 * Handles device registration, notification received, and action listeners.
 */

import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Initialize push notifications.
 * Call this once on app startup (after Firebase is configured).
 */
export async function initPushNotifications() {
  if (!isNative) return { registered: false, reason: 'not-native' }

  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      return { registered: false, reason: 'permission-denied' }
    }

    // Register for push notifications
    await PushNotifications.register()

    return { registered: true }
  } catch (err) {
    console.warn('[PushNotifications] Init failed:', err.message)
    return { registered: false, reason: err.message }
  }
}

/**
 * Register the device token with your backend server.
 * @param {string} token - The FCM device token
 */
export async function registerDevice(token) {
  // TODO: Send token to your backend for targeted push
  // Example: await fetch(`${API_BASE}/api/devices/register`, { method: 'POST', body: JSON.stringify({ token }) })
  console.info('[PushNotifications] Device token:', token)
}

/**
 * Set up notification event listeners.
 * @param {Object} handlers
 * @param {Function} handlers.onReceived - Called when notification is received while app is foregrounded
 * @param {Function} handlers.onActionPerformed - Called when user taps a notification action
 * @param {Function} handlers.onRegistered - Called when device is registered with FCM
 * @param {Function} handlers.onError - Called on any error
 */
export function setupNotificationListeners(handlers = {}) {
  if (!isNative) return () => {}

  // Device registered
  const regListener = PushNotifications.addListener('registration', (token) => {
    registerDevice(token.value)
    handlers.onRegistered?.(token.value)
  })

  // Registration error
  const errListener = PushNotifications.addListener('registrationError', (err) => {
    console.error('[PushNotifications] Registration error:', err)
    handlers.onError?.(err)
  })

  // Notification received (app in foreground)
  const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
    handlers.onReceived?.(notification)
  })

  // Notification action performed (user tapped)
  const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    handlers.onActionPerformed?.(action)
  })

  // Cleanup function
  return async () => {
    await regListener.remove()
    await errListener.remove()
    await receivedListener.remove()
    await actionListener.remove()
  }
}

/**
 * Get delivered notifications (notifications shown in the notification center).
 */
export async function getDeliveredNotifications() {
  if (!isNative) return []
  try {
    const result = await PushNotifications.getDeliveredNotifications()
    return result.notifications || []
  } catch {
    return []
  }
}

/**
 * Remove all delivered notifications from the notification center.
 */
export async function clearDeliveredNotifications() {
  if (!isNative) return
  try {
    await PushNotifications.removeAllDeliveredNotifications()
  } catch {
    // silent
  }
}

/**
 * Remove a specific delivered notification by ID.
 */
export async function removeDeliveredNotification(id) {
  if (!isNative) return
  try {
    await PushNotifications.removeDeliveredNotifications({ notifications: [{ id }] })
  } catch {
    // silent
  }
}
