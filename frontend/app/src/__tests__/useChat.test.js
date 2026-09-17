/**
 * useChat.test.js — Tests for the useChat hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../hooks/useChat'

// Mock the API client
vi.mock('../api/client', () => ({
  ask: vi.fn(),
  fetchHealth: vi.fn().mockResolvedValue({
    status: 'online',
    gen3: { available: true },
    phase1: 'ready',
    faq_count: 100,
  }),
  fetchHistory: vi.fn().mockResolvedValue([]),
  fetchThreadMessages: vi.fn(),
  getSuggestions: vi.fn().mockResolvedValue(['Admission', 'Frais']),
  deleteHistory: vi.fn(),
  submitFeedback: vi.fn(),
  resolveServerStatus: vi.fn().mockReturnValue('online'),
}))

describe('useChat', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.messages).toEqual([])
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.showWelcome).toBe(true)
  })

  it('should reset chat', async () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.resetChat()
    })

    expect(result.current.messages).toEqual([])
    expect(result.current.showWelcome).toBe(true)
  })

  it('should show toast messages', async () => {
    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.showToastMsg('Test toast')
    })

    expect(result.current.toast).toBe('Test toast')

    // Wait for toast to clear
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    })

    expect(result.current.toast).toBe('')
  })

  it('should have correct online status', () => {
    const { result } = renderHook(() => useChat())

    // Initially checking
    expect(['checking', 'online', 'offline']).toContain(result.current.serverStatus)
  })
})
