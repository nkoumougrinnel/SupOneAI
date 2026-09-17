/**
 * performanceMonitor.js — Performance metrics tracking for SUP'ONE AI
 *
 * Measures API response times, TTI, FCP, and other web vitals.
 * Sends metrics to backend for monitoring.
 */

const API_BASE = import.meta.env.VITE_API_URL || ''

let metricsBuffer = []
const MAX_BUFFER_SIZE = 50

/**
 * Start a performance timer.
 * @param {string} label - Timer label
 * @returns {Function} Stop function that returns elapsed ms
 */
export function startTimer(label) {
  const start = performance.now()
  return () => {
    const elapsed = performance.now() - start
    recordMetric(label, elapsed)
    return elapsed
  }
}

/**
 * Record a metric.
 * @param {string} name - Metric name
 * @param {number} value - Metric value (ms)
 * @param {Object} tags - Additional tags
 */
export function recordMetric(name, value, tags = {}) {
  const metric = {
    name,
    value: Math.round(value * 100) / 100,
    timestamp: Date.now(),
    tags,
  }

  metricsBuffer.push(metric)

  // Flush if buffer is full
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics()
  }
}

/**
 * Flush accumulated metrics to backend.
 */
export async function flushMetrics() {
  if (metricsBuffer.length === 0) return

  const toSend = [...metricsBuffer]
  metricsBuffer = []

  try {
    const res = await fetch(`${API_BASE}/api/metrics/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: toSend }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      // Re-add to buffer on failure
      metricsBuffer = [...toSend, ...metricsBuffer].slice(0, MAX_BUFFER_SIZE)
    }
  } catch {
    // Network error — re-add to buffer
    metricsBuffer = [...toSend, ...metricsBuffer].slice(0, MAX_BUFFER_SIZE)
  }
}

// ─── Web Vitals ──────────────────────────────────────────────────────────────

/**
 * Measure First Contentful Paint (FCP).
 */
export function measureFCP() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('fcp', entry.startTime)
        }
      }
    })
    observer.observe({ type: 'paint', buffered: true })
  } catch {
    // Not supported
  }
}

/**
 * Measure Largest Contentful Paint (LCP).
 */
export function measureLCP() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        recordMetric('lcp', lastEntry.startTime)
      }
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // Not supported
  }
}

/**
 * Measure Cumulative Layout Shift (CLS).
 */
export function measureCLS() {
  if (typeof PerformanceObserver === 'undefined') return

  let clsValue = 0

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      recordMetric('cls', clsValue)
    })
    observer.observe({ type: 'layout-shift', buffered: true })
  } catch {
    // Not supported
  }
}

/**
 * Measure First Input Delay (FID).
 */
export function measureFID() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        recordMetric('fid', entry.processingStart - entry.startTime)
      }
    })
    observer.observe({ type: 'first-input', buffered: true })
  } catch {
    // Not supported
  }
}

// ─── API Response Time ───────────────────────────────────────────────────────

/**
 * Measure API response time for a fetch call.
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export async function measuredFetch(url, options = {}) {
  const stop = startTimer(`api:${url}`)
  try {
    const res = await fetch(url, options)
    stop()
    return res
  } catch (err) {
    stop()
    throw err
  }
}

// ─── Time to Interactive ─────────────────────────────────────────────────────

/**
 * Estimate Time to Interactive (TTI).
 * Records when the app becomes interactive after load.
 */
export function measureTTI() {
  if (typeof document === 'undefined') return

  const checkInteractive = () => {
    if (document.readyState === 'complete') {
      const tti = performance.now()
      recordMetric('tti', tti)
    }
  }

  if (document.readyState === 'complete') {
    checkInteractive()
  } else {
    window.addEventListener('load', checkInteractive)
  }
}

// ─── Init All ────────────────────────────────────────────────────────────────

/**
 * Initialize all performance monitors.
 * Call this once at app startup.
 */
export function initPerformanceMonitoring() {
  measureFCP()
  measureLCP()
  measureCLS()
  measureFID()
  measureTTI()

  // Flush metrics periodically
  setInterval(flushMetrics, 30000) // Every 30 seconds

  // Flush on page visibility change (background)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics()
      }
    })
  }
}

/**
 * Get current metrics summary.
 */
export function getMetricsSummary() {
  return {
    buffered: metricsBuffer.length,
    lastFlush: Date.now(),
  }
}
