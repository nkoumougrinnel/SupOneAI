/**
 * useGestureRecognizer.js — Touch gesture recognition hook
 *
 * Detects swipe left/right, long press, and pinch gestures.
 * Uses @capacitor/gesture for native, or pointer events for browser.
 */

import { useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Hook for recognizing common gestures on an element.
 * @param {Object} options
 * @param {React.Ref} options.ref - Ref to the gesture target element
 * @param {Function} options.onSwipeLeft - Called on swipe left
 * @param {Function} options.onSwipeRight - Called on swipe right
 * @param {Function} options.onLongPress - Called on long press (receives position)
 * @param {Function} options.onPinch - Called on pinch (receives scale)
 * @param {Object} options.thresholds - Gesture thresholds
 * @returns {Object} Gesture state
 */
export function useGestureDetector({
  ref,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onPinch,
  thresholds = {
    swipeDistance: 50,
    swipeVelocity: 0.3,
    longPressDelay: 500,
    pinchThreshold: 0.1,
  },
}) {
  const stateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    longPressTimer: null,
    isLongPressing: false,
    initialPinchDistance: 0,
  })

  useEffect(() => {
    const element = ref?.current
    if (!element) return

    const state = stateRef.current

    const handlePointerDown = (e) => {
      state.startX = e.clientX
      state.startY = e.clientY
      state.startTime = Date.now()
      state.isLongPressing = false

      // Start long press timer
      if (onLongPress) {
        state.longPressTimer = setTimeout(() => {
          state.isLongPressing = true
          onLongPress({ x: e.clientX, y: e.clientY })
        }, thresholds.longPressDelay)
      }
    }

    const handlePointerMove = (e) => {
      if (!state.longPressTimer) return

      const dx = Math.abs(e.clientX - state.startX)
      const dy = Math.abs(e.clientY - state.startY)

      // Cancel long press if finger moved
      if (dx > 10 || dy > 10) {
        clearTimeout(state.longPressTimer)
        state.longPressTimer = null
      }
    }

    const handlePointerUp = (e) => {
      // Cancel long press timer
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer)
        state.longPressTimer = null
      }

      if (state.isLongPressing) {
        state.isLongPressing = false
        return
      }

      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY
      const dt = Date.now() - state.startTime
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Check for swipe (horizontal, fast enough)
      if (absDx > thresholds.swipeDistance && absDx > absDy) {
        const velocity = absDx / dt
        if (velocity > thresholds.swipeVelocity) {
          if (dx > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
          return
        }
      }
    }

    const handleTouchStart = (e) => {
      if (e.touches.length === 2 && onPinch) {
        const [t1, t2] = [e.touches[0], e.touches[1]]
        state.initialPinchDistance = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY
        )
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && onPinch && state.initialPinchDistance > 0) {
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const currentDistance = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY
        )
        const scale = currentDistance / state.initialPinchDistance
        if (Math.abs(scale - 1) > thresholds.pinchThreshold) {
          onPinch(scale)
        }
      }
    }

    const handleTouchEnd = () => {
      state.initialPinchDistance = 0
    }

    // Attach event listeners
    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)

      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer)
      }
    }
  }, [ref, onSwipeLeft, onSwipeRight, onLongPress, onPinch, thresholds])

  return {
    isNative,
  }
}

/**
 * Simple swipe detection for sidebar open/close.
 * @param {Function} onSwipeRight - Open sidebar
 * @param {Function} onSwipeLeft - Close sidebar
 * @returns {Object} Ref to attach to the main container
 */
export function useSwipeSidebar(onSwipeRight, onSwipeLeft) {
  const ref = useRef(null)

  useGestureDetector({
    ref,
    onSwipeRight,
    onSwipeLeft,
    thresholds: {
      swipeDistance: 80,
      swipeVelocity: 0.2,
      longPressDelay: 99999, // Disable long press for sidebar
    },
  })

  return ref
}
