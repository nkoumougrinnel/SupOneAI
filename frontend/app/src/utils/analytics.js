/**
 * analytics.js — Analytics utilities for SUP'ONE AI
 *
 * Provides a thin wrapper around Firebase Analytics (web) and console (native).
 * Tracks user engagement, questions, responses, and feature usage.
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

let analyticsEnabled = false
let firebaseAnalytics = null

/**
 * Initialize analytics.
 * @param {Object} options
 * @param {boolean} options.enabled - Whether analytics is enabled (requires consent)
 */
export function initAnalytics({ enabled = false } = {}) {
  analyticsEnabled = enabled

  if (!enabled) return

  // Firebase Analytics (web only — requires firebase SDK)
  if (!isNative && typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid bundling Firebase if not needed
      import('firebase/analytics').then(({ getAnalytics }) => {
        // Firebase config should be provided externally
        // For now, we use a no-op if Firebase isn't configured
        console.info('[Analytics] Firebase Analytics available')
      }).catch(() => {
        console.info('[Analytics] Firebase not configured, using console fallback')
      })
    } catch {
      // Firebase not available
    }
  }
}

/**
 * Log an analytics event.
 * @param {string} name - Event name
 * @param {Object} params - Event parameters
 */
export function logEvent(name, params = {}) {
  if (!analyticsEnabled) return

  const event = {
    name,
    params: {
      ...params,
      timestamp: Date.now(),
      platform: isNative ? 'capacitor' : 'pwa',
    },
  }

  // Console fallback (always available)
  console.info(`[Analytics] ${name}`, event.params)

  // Firebase Analytics (if available)
  if (firebaseAnalytics) {
    try {
      // firebaseAnalytics.logEvent(name, params)
    } catch {
      // silent
    }
  }
}

// ─── Predefined Events ──────────────────────────────────────────────────────

/**
 * Track when a user sends a question.
 */
export function trackQuestionSent(question, mode) {
  logEvent('question_sent', {
    question_length: question.length,
    mode, // 'gen3' | 'faq' | 'low' | 'medium'
  })
}

/**
 * Track when a response is received.
 */
export function trackResponseReceived(mode, elapsedMs, answerLength) {
  logEvent('response_received', {
    mode,
    elapsed_ms: elapsedMs,
    answer_length: answerLength,
  })
}

/**
 * Track when a user gives feedback.
 */
export function trackFeedback(faqId, feedbackType) {
  logEvent('feedback_submitted', {
    faq_id: faqId,
    feedback_type: feedbackType, // 'positive' | 'negative'
  })
}

/**
 * Track session start.
 */
export function trackSessionStart() {
  logEvent('session_start', {
    is_native: isNative,
  })
}

/**
 * Track session end.
 */
export function trackSessionEnd(durationMs) {
  logEvent('session_end', {
    duration_ms: durationMs,
  })
}

/**
 * Track when a user loads a thread from history.
 */
export function trackThreadLoaded(threadId, messageCount) {
  logEvent('thread_loaded', {
    thread_id: threadId,
    message_count: messageCount,
  })
}

/**
 * Track when a user shares a response.
 */
export function trackShare(platform) {
  logEvent('share_response', { platform })
}

/**
 * Track PWA install prompt.
 */
export function trackPwaInstall(outcome) {
  logEvent('pwa_install', { outcome }) // 'accepted' | 'dismissed'
}

/**
 * Track errors (non-Sentry).
 */
export function trackError(errorType, context) {
  logEvent('app_error', {
    error_type: errorType,
    context,
  })
}

/**
 * Track feature usage.
 */
export function trackFeatureUsed(feature) {
  logEvent('feature_used', { feature })
}

/**
 * Enable/disable analytics based on user consent.
 * @param {boolean} enabled
 */
export function setAnalyticsEnabled(enabled) {
  analyticsEnabled = enabled
  if (!enabled) {
    logEvent('analytics_disabled')
  }
}

/**
 * Check if analytics is enabled.
 */
export function isAnalyticsEnabled() {
  return analyticsEnabled
}
