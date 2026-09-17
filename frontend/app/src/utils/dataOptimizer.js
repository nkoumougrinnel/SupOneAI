/**
 * dataOptimizer.js — Data usage optimization utilities for SUP'ONE AI
 *
 * Provides image compression, efficient encoding, and data estimation.
 */

/**
 * Compress an image before upload to reduce data usage.
 * Targets max 100KB for most images.
 * @param {File|Blob} file - Image to compress
 * @param {number} maxKB - Maximum size in KB
 * @returns {Promise<Blob>} Compressed image
 */
export async function compressForUpload(file, maxKB = 100) {
  const maxBytes = maxKB * 1024

  // If already small enough, return as-is
  if (file.size <= maxBytes) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img

      const tryCompress = (targetW, targetH, quality) => {
        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, targetW, targetH)

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= maxBytes) {
              URL.revokeObjectURL(url)
              resolve(blob)
            } else if (quality > 0.1) {
              tryCompress(targetW, targetH, quality - 0.1)
            } else if (targetW > 100) {
              const newW = Math.round(targetW * 0.75)
              const newH = Math.round(newW * (h / w))
              tryCompress(newW, newH, 0.7)
            } else {
              URL.revokeObjectURL(url)
              resolve(blob || file)
            }
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress(w, h, 0.7)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Efficiently encode a file to base64.
 * @param {File|Blob} file
 * @returns {Promise<string>} Base64 string (without data URL prefix)
 */
export async function efficientBase64Encode(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Estimate data usage for a request/response pair.
 * @param {string} question - User question
 * @param {string} answer - Bot answer
 * @returns {Object} Size estimates
 */
export function estimateDataUsage(question, answer) {
  const encoder = new TextEncoder()
  const questionBytes = encoder.encode(question).length
  const answerBytes = encoder.encode(answer).length
  const totalBytes = questionBytes + answerBytes

  return {
    questionBytes,
    answerBytes,
    totalBytes,
    questionKB: (questionBytes / 1024).toFixed(2),
    answerKB: (answerBytes / 1024).toFixed(2),
    totalKB: (totalBytes / 1024).toFixed(2),
    totalMB: (totalBytes / (1024 * 1024)).toFixed(4),
  }
}

/**
 * Truncate a response for display to save screen space.
 * @param {string} text - Full response text
 * @param {number} maxLength - Maximum characters to show
 * @returns {string} Truncated text with ellipsis
 */
export function truncateResponse(text, maxLength = 500) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Estimate how many messages can fit in localStorage
 * based on current usage.
 * @returns {Object} Storage estimate
 */
export function estimateStorageUsage() {
  try {
    let totalBytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('supone')) {
        const value = localStorage.getItem(key) || ''
        totalBytes += key.length + value.length
      }
    }

    const usedMB = (totalBytes / (1024 * 1024)).toFixed(2)
    const limitMB = 5 // Typical localStorage limit
    const remainingMB = (limitMB - parseFloat(usedMB)).toFixed(2)
    const percentUsed = ((totalBytes / (limitMB * 1024 * 1024)) * 100).toFixed(1)

    return {
      usedBytes: totalBytes,
      usedMB: parseFloat(usedMB),
      limitMB,
      remainingMB: parseFloat(remainingMB),
      percentUsed: parseFloat(percentUsed),
    }
  } catch {
    return { usedBytes: 0, usedMB: 0, limitMB: 5, remainingMB: 5, percentUsed: 0 }
  }
}
