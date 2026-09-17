/**
 * fileManager.js — File system utilities for SUP'ONE AI
 *
 * Uses @capacitor/filesystem for reading/writing files on the device.
 * Supports chat history export/import and file downloads.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

/**
 * Save chat history to a JSON file on the device.
 * @param {Array} messages - Chat messages array
 * @param {string} filename - Filename (without extension)
 * @returns {Promise<Object>} Save result
 */
export async function saveChatToFile(messages, filename) {
  const content = JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    app: "SUP'ONE AI",
    messages,
  }, null, 2)

  if (isNative) {
    try {
      const result = await Filesystem.writeFile({
        path: `${filename}.json`,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
      return { saved: true, uri: result.uri }
    } catch (err) {
      return { saved: false, reason: err.message }
    }
  }

  // Browser fallback: download as file
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return { saved: true, method: 'browser-download' }
}

/**
 * Read a chat history file from the device.
 * @param {string} filepath - Path to the file
 * @returns {Promise<Object>} Parsed chat data
 */
export async function readChatFromFile(filepath) {
  if (!isNative) {
    return { read: false, reason: 'not-supported-browser' }
  }

  try {
    const result = await Filesystem.readFile({
      path: filepath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })

    const data = JSON.parse(result.data)
    return { read: true, data }
  } catch (err) {
    return { read: false, reason: err.message }
  }
}

/**
 * List all exported chat files in the Documents directory.
 * @returns {Promise<Array>} List of file info objects
 */
export async function listChatFiles() {
  if (!isNative) return []

  try {
    const result = await Filesystem.readdir({
      path: '/',
      directory: Directory.Documents,
    })

    return result.files
      .filter((f) => f.name.endsWith('.json') && f.name.startsWith('supone-chat'))
      .map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        uri: f.uri,
      }))
  } catch {
    return []
  }
}

/**
 * Delete a chat file from the device.
 * @param {string} filename - Name of the file to delete
 */
export async function deleteChatFile(filename) {
  if (!isNative) return { deleted: false, reason: 'not-supported-browser' }

  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Documents,
    })
    return { deleted: true }
  } catch (err) {
    return { deleted: false, reason: err.message }
  }
}

/**
 * Export chat history and save to device.
 * @param {Array} messages - Messages to export
 * @param {string} format - 'json' or 'txt'
 */
export async function exportHistoryToStorage(messages, format = 'json') {
  const filename = `supone-chat-${Date.now()}`

  if (format === 'json') {
    return saveChatToFile(messages, filename)
  }

  // TXT format
  const lines = messages.map((msg) => {
    const role = msg.role === 'user' ? 'Vous' : "SUP'ONE AI"
    return `[${role}]\n${msg.content}\n`
  })
  const content = lines.join('\n' + '─'.repeat(40) + '\n\n')

  if (isNative) {
    try {
      const result = await Filesystem.writeFile({
        path: `${filename}.txt`,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
      return { saved: true, uri: result.uri }
    } catch (err) {
      return { saved: false, reason: err.message }
    }
  }

  // Browser fallback
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return { saved: true, method: 'browser-download' }
}
