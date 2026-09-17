/**
 * localNotifications.js — Local notification management for SUP'ONE AI
 *
 * Uses @capacitor/local-notifications for immediate/scheduled local alerts.
 * Useful for: long response completions, error alerts, offline queue sync.
 */

import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Request local notification permissions.
 */
export async function requestLocalNotificationPermission() {
  if (!isNative) return { display: 'denied' }
  try {
    const permission = await LocalNotifications.requestPermissions()
    return permission
  } catch {
    return { display: 'denied' }
  }
}

/**
 * Send an immediate local notification.
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.subtitle] - Notification subtitle
 * @param {string} [options.id] - Unique ID (auto-generated if not provided)
 * @param {Array} [options.actions] - Action buttons [{id, title}]
 * @param {string} [options.sound] - Sound to play (default: device default)
 * @returns {Promise<Object>} Notification result
 */
export async function sendLocalNotification({
  title,
  body,
  subtitle = '',
  id = null,
  actions = [],
  sound = true,
}) {
  if (!isNative) {
    // Fallback to browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' })
    }
    return { sent: false, reason: 'browser-fallback' }
  }

  try {
    const notificationId = id || Math.floor(Date.now() / 1000)
    const notification = {
      title,
      body,
      subtitle,
      id: notificationId,
      sound: sound ? 'default' : undefined,
      attachments: undefined,
      actionTypeId: actions.length > 0 ? 'SUPONE_ACTION' : undefined,
      extra: { timestamp: Date.now() },
    }

    // Register action types if actions are provided
    if (actions.length > 0) {
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'SUPONE_ACTION',
            actions: actions.map((a) => ({
              id: a.id,
              title: a.title,
              destructive: false,
              authenticationRequired: false,
            })),
          },
        ],
      })
    }

    const result = await LocalNotifications.schedule({
      notifications: [notification],
    })

    return { sent: true, result }
  } catch (err) {
    console.warn('[LocalNotifications] Send failed:', err.message)
    return { sent: false, reason: err.message }
  }
}

/**
 * Send a notification for a long response (>500 chars).
 * @param {string} answer - The bot's answer text
 */
export async function notifyLongResponse(answer) {
  const preview = answer.length > 100 ? answer.slice(0, 100) + '…' : answer
  return sendLocalNotification({
    title: "SUP'ONE AI — Réponse prête",
    body: preview,
  })
}

/**
 * Send a notification for a critical error.
 * @param {string} errorMsg - The error message
 */
export async function notifyError(errorMsg) {
  return sendLocalNotification({
    title: "SUP'ONE AI — Erreur",
    body: errorMsg || 'Une erreur est survenue. Vérifiez votre connexion.',
  })
}

/**
 * Send a notification for offline queue sync.
 * @param {number} count - Number of messages synced
 */
export async function notifySyncComplete(count) {
  return sendLocalNotification({
    title: "SUP'ONE AI — Synchronisation",
    body: `${count} message(s) synchronisé(s) avec succès.`,
  })
}

/**
 * Cancel all pending local notifications.
 */
export async function cancelAllNotifications() {
  if (!isNative) return
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      })
    }
  } catch {
    // silent
  }
}

/**
 * Get pending (scheduled) notifications.
 */
export async function getPendingNotifications() {
  if (!isNative) return []
  try {
    const result = await LocalNotifications.getPending()
    return result.notifications || []
  } catch {
    return []
  }
}

/**
 * Set up listener for notification action taps.
 * @param {Function} handler - Called with { action, notification } when user taps an action
 */
export function onNotificationActionPerformed(handler) {
  if (!isNative) return () => {}

  const listener = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      handler?.(action)
    }
  )

  return () => listener.then((l) => l.remove())
}
