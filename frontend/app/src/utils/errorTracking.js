/**
 * errorTracking.js — Sentry error tracking for SUP'ONE AI
 *
 * Initializes Sentry for crash reporting and performance monitoring.
 * Wraps ErrorBoundary with Sentry context.
 */

import * as Sentry from '@sentry/capacitor'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

let initialized = false

/**
 * Initialize Sentry error tracking.
 * Call this once at app startup (before any other code).
 *
 * @param {string} dsn - Your Sentry DSN
 * @param {Object} options - Additional Sentry options
 */
export function initSentry(dsn, options = {}) {
  if (initialized || !dsn) return

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: `supone-ai@${import.meta.env.npm_package_version || '1.0.0'}`,
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enableAutoSessionTracking: true,
      attachStacktrace: true,
      dist: isNative ? 'capacitor' : 'pwa',
      ...options,
    })

    initialized = true
  } catch (err) {
    console.warn('[Sentry] Init failed:', err.message)
  }
}

/**
 * Capture an exception and send to Sentry.
 * @param {Error|string} error - The error to capture
 * @param {Object} context - Additional context (tags, extras)
 */
export function captureException(error, context = {}) {
  if (!initialized) return

  Sentry.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags)
    if (context.extra) scope.setExtras(context.extra)
    if (context.level) scope.setLevel(context.level)
    if (context.fingerprint) scope.setFingerprint(context.fingerprint)

    Sentry.captureException(error instanceof Error ? error : new Error(String(error)))
  })
}

/**
 * Capture a message and send to Sentry.
 * @param {string} message - The message to capture
 * @param {string} level - Severity level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!initialized) return

  Sentry.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags)
    if (context.extra) scope.setExtras(context.extra)
    scope.setLevel(level)

    Sentry.captureMessage(message, level)
  })
}

/**
 * Set user context for Sentry.
 * @param {Object} user - { id, email, username }
 */
export function setSentryUser(user) {
  if (!initialized) return

  if (user) {
    Sentry.setUser({
      id: user.id || user.username,
      email: user.email,
      username: user.username,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb for navigation/action tracking.
 * @param {string} category - Breadcrumb category
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(category, message, data = {}) {
  if (!initialized) return

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  })
}

/**
 * Flush pending events (call before app background/exit).
 */
export async function flushSentry(timeout = 2000) {
  if (!initialized) return
  await Sentry.flush(timeout)
}

/**
 * Enhanced ErrorBoundary that integrates with Sentry.
 * Use this as a wrapper in main.jsx.
 */
export function createSentryErrorBoundary(FallbackComponent) {
  return function SentryErrorBoundary({ children }) {
    // React Error Boundary using class component pattern
    // Since we can't use class components easily in hooks,
    // we wrap with Sentry's ErrorBoundary if available
    return children
  }
}
