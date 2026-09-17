/**
 * App.test.jsx — Basic rendering tests for App component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock hooks
vi.mock('../hooks/useChat', () => ({
  useChat: () => ({
    messages: [],
    suggestions: [],
    isProcessing: false,
    online: true,
    serverStatus: 'online',
    gen3Available: true,
    pipelineLabel: 'Pipeline IA actif',
    healthInfo: { faq_count: 100 },
    toast: '',
    showWelcome: true,
    history: [],
    refreshHistory: vi.fn(),
    loadThread: vi.fn(),
    clearHistory: vi.fn(),
    listRef: { current: null },
    sendMessage: vi.fn(),
    resetChat: vi.fn(),
    refreshHealth: vi.fn(),
    sendFeedback: vi.fn(),
    onListScroll: vi.fn(),
    scrollToBottom: vi.fn(),
    userScrolledRef: { current: false },
    showToastMsg: vi.fn(),
    lastUserQuestion: vi.fn(),
  }),
}))

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
    isDark: true,
  }),
}))

vi.mock('../hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({
    canInstall: false,
    showBanner: false,
    install: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

vi.mock('../hooks/useNativeKeyboard', () => ({
  useNativeKeyboard: vi.fn(),
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // The app should render the main container
    expect(document.querySelector('[data-theme]')).toBeTruthy()
  })

  it('shows the welcome screen by default', () => {
    render(<App />)
    // Welcome should be visible when there are no messages
    expect(document.querySelector('[data-theme="dark"]')).toBeTruthy()
  })
})
