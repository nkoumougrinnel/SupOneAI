/**
 * ContextMenu.jsx — Long-press context menu for message actions
 *
 * Displays a popup menu with options: Copy, Share, Delete.
 * Triggered by long press on message bubbles.
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Context menu component.
 * @param {Object} props
 * @param {boolean} props.open - Whether the menu is visible
 * @param {number} props.x - X position (from touch event)
 * @param {number} props.y - Y position (from touch event)
 * @param {Object} props.message - The message object being acted on
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onCopy - Copy message handler
 * @param {Function} props.onShare - Share message handler
 * @param {Function} props.onDelete - Delete message handler
 */
export default function ContextMenu({
  open,
  x = 0,
  y = 0,
  message,
  onClose,
  onCopy,
  onShare,
  onDelete,
}) {
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open || !message) return null

  // Clamp position to viewport
  const menuWidth = 180
  const menuHeight = 140
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 10)
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 10)

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Actions du message"
      style={{
        position: 'fixed',
        left: clampedX,
        top: clampedY,
        zIndex: 9999,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        padding: '4px 0',
        minWidth: menuWidth,
        animation: 'fadeIn .15s ease',
      }}
    >
      <MenuItem
        icon="📋"
        label="Copier"
        onClick={() => {
          onCopy?.(message)
          onClose()
        }}
      />
      {message.role === 'bot' && (
        <MenuItem
          icon="📤"
          label="Partager"
          onClick={() => {
            onShare?.(message)
            onClose()
          }}
        />
      )}
      <div
        style={{
          height: 1,
          background: 'var(--border-light)',
          margin: '4px 8px',
        }}
      />
      <MenuItem
        icon="🗑️"
        label="Supprimer"
        danger
        onClick={() => {
          onDelete?.(message)
          onClose()
        }}
      />
    </div>
  )
}

/**
 * Single menu item.
 */
function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 16px',
        fontSize: 14,
        color: danger ? 'var(--error)' : 'var(--text-primary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background var(--t-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}

/**
 * Hook to detect long press on an element.
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options
 * @param {number} options.delay - Long press delay in ms (default: 500)
 * @returns {Object} Event handlers to spread on the element
 */
export function useLongPress(onLongPress, { delay = 500 } = {}) {
  const timerRef = useRef(null)
  const startPosRef = useRef(null)

  const start = (e) => {
    const touch = e.touches?.[0] || e
    startPosRef.current = { x: touch.clientX, y: touch.clientY }

    timerRef.current = setTimeout(() => {
      onLongPress(e, { x: touch.clientX, y: touch.clientY })
    }, delay)
  }

  const move = (e) => {
    if (!startPosRef.current || !timerRef.current) return
    const touch = e.touches?.[0] || e
    const dx = Math.abs(touch.clientX - startPosRef.current.x)
    const dy = Math.abs(touch.clientY - startPosRef.current.y)
    // Cancel if finger moved more than 10px
    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const end = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: end,
  }
}
