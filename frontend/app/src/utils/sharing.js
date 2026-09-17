/**
 * sharing.js — Native sharing and export utilities for SUP'ONE AI
 *
 * Uses @capacitor/share for native Android sharing,
 * and generates exportable formats (TXT, JSON).
 */

import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Share a chat response using the native share sheet.
 * @param {Object} options
 * @param {string} options.question - The user's question
 * @param {string} options.answer - The bot's answer
 * @param {string} [options.title] - Share dialog title
 */
export async function shareResponse({ question, answer, title = "SUP'ONE AI" }) {
  const text = `🤖 ${title}\n\n❓ ${question}\n\n💬 ${answer}\n\n— Partagé depuis SUP'ONE AI`

  if (isNative) {
    try {
      const result = await Share.share({
        title,
        text,
        dialogTitle: 'Partager la réponse',
      })
      return { shared: !result.completed, result }
    } catch (err) {
      // User cancelled or error
      return { shared: false, reason: err.message }
    }
  }

  // Browser fallback: use Clipboard API
  try {
    await navigator.clipboard.writeText(text)
    return { shared: true, method: 'clipboard' }
  } catch {
    return { shared: false, reason: 'clipboard-failed' }
  }
}

/**
 * Share to a specific platform.
 * @param {string} platform - 'whatsapp' | 'telegram' | 'twitter' | 'email'
 * @param {Object} content - { title, text }
 */
export function shareToSocial(platform, { title, text }) {
  const encodedText = encodeURIComponent(text)
  const encodedTitle = encodeURIComponent(title)

  const urls = {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedTitle}&text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
  }

  const url = urls[platform]
  if (!url) return false

  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

/**
 * Export chat messages to a file.
 * @param {Array} messages - Array of message objects
 * @param {string} format - 'txt' | 'json'
 */
export function exportChat(messages, format = 'txt') {
  let content, filename, mimeType

  if (format === 'json') {
    content = JSON.stringify(messages, null, 2)
    filename = `supone-chat-${Date.now()}.json`
    mimeType = 'application/json'
  } else {
    // TXT format
    const lines = messages.map((msg) => {
      const role = msg.role === 'user' ? 'Vous' : "SUP'ONE AI"
      return `[${role}]\n${msg.content}\n`
    })
    content = lines.join('\n' + '─'.repeat(40) + '\n\n')
    filename = `supone-chat-${Date.now()}.txt`
    mimeType = 'text/plain'
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { exported: true, filename }
}

/**
 * Copy text to clipboard.
 * @param {string} text
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return { copied: true }
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return { copied: true }
  }
}
