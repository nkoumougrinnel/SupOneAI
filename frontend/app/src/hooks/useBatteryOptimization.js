/**
 * useBatteryOptimization.js — Battery-aware optimization hook
 *
 * Reads battery level and adapts app behavior:
 * - Reduce polling frequency when battery is low
 * - Disable animations when battery is critical
 * - Show battery economy badge
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { Device } from '@capacitor/device'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

const POLL_INTERVALS = {
  normal: 25000,    // 25s — normal mode
  low: 60000,       // 60s — low battery
  critical: 120000, // 120s — critical battery
}

/**
 * Hook to manage battery-aware optimizations.
 * @returns {Object} Battery status and optimization helpers
 */
export function useBatteryOptimization() {
  const [battery, setBattery] = useState({
    level: 100,
    charging: false,
    isLow: false,
    isCritical: false,
    economyMode: false,
  })

  const pollIntervalRef = useRef(POLL_INTERVALS.normal)

  // Get the appropriate polling interval based on battery level
  const getPollInterval = useCallback(() => {
    return pollIntervalRef.current
  }, [])

  // Check battery status
  const checkBattery = useCallback(async () => {
    if (isNative) {
      try {
        const info = await Device.getBatteryInfo()
        const level = Math.round((info.batteryLevel || 0) * 100)
        const charging = info.isCharging || false

        const isLow = level <= 20 && !charging
        const isCritical = level <= 10 && !charging
        const economyMode = isLow || isCritical

        // Adjust poll interval
        if (isCritical) {
          pollIntervalRef.current = POLL_INTERVALS.critical
        } else if (isLow) {
          pollIntervalRef.current = POLL_INTERVALS.low
        } else {
          pollIntervalRef.current = POLL_INTERVALS.normal
        }

        setBattery({ level, charging, isLow, isCritical, economyMode })
        return { level, charging, isLow, isCritical, economyMode }
      } catch {
        setBattery({
          level: 100,
          charging: false,
          isLow: false,
          isCritical: false,
          economyMode: false,
        })
        return null
      }
    }

    // Browser: use Battery API if available
    if ('getBattery' in navigator) {
      try {
        const batt = await navigator.getBattery()
        const level = Math.round(batt.level * 100)
        const charging = batt.charging

        const isLow = level <= 20 && !charging
        const isCritical = level <= 10 && !charging
        const economyMode = isLow || isCritical

        if (isCritical) {
          pollIntervalRef.current = POLL_INTERVALS.critical
        } else if (isLow) {
          pollIntervalRef.current = POLL_INTERVALS.low
        } else {
          pollIntervalRef.current = POLL_INTERVALS.normal
        }

        setBattery({ level, charging, isLow, isCritical, economyMode })

        // Listen for changes
        const handleLevelChange = () => {
          checkBattery()
        }
        const handleChargingChange = () => {
          checkBattery()
        }

        batt.addEventListener('levelchange', handleLevelChange)
        batt.addEventListener('chargingchange', handleChargingChange)

        return { level, charging, isLow, isCritical, economyMode }
      } catch {
        // Battery API not supported
      }
    }

    // Fallback: assume full battery
    setBattery({
      level: 100,
      charging: false,
      isLow: false,
      isCritical: false,
      economyMode: false,
    })
    return null
  }, [])

  // Should reduce animations?
  const shouldReduceAnimations = battery.isCritical || battery.economyMode

  // Should disable auto-refresh?
  const shouldDisableAutoRefresh = battery.isCritical

  useEffect(() => {
    checkBattery()
  }, [checkBattery])

  return {
    ...battery,
    checkBattery,
    getPollInterval,
    shouldReduceAnimations,
    shouldDisableAutoRefresh,
  }
}
