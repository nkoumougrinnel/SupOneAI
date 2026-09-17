/**
 * imageOptimizer.js — Image optimization utilities for SUP'ONE AI
 *
 * Provides lazy loading, WebP conversion with PNG fallback,
 * and compression for uploads.
 */

/**
 * Add lazy loading to all images in the document.
 * Uses native `loading="lazy"` attribute.
 */
export function initLazyLoading() {
  if (typeof document === 'undefined') return

  const images = document.querySelectorAll('img:not([loading])')
  images.forEach((img) => {
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
  })
}

/**
 * Check if the browser supports WebP format.
 */
export function supportsWebP() {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Convert an image file to WebP format with fallback to original.
 * @param {File|Blob} file - The image file to convert
 * @param {number} quality - WebP quality (0-1), default 0.8
 * @returns {Promise<Blob>} The optimized image blob
 */
export async function convertToWebP(file, quality = 0.8) {
  if (!supportsWebP()) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          resolve(blob || file)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Compress an image file to a maximum size in KB.
 * Resizes if necessary to meet the target size.
 * @param {File|Blob} file - The image to compress
 * @param {number} maxKB - Maximum size in kilobytes
 * @returns {Promise<Blob>} The compressed image blob
 */
export async function compressImage(file, maxKB = 100) {
  const maxBytes = maxKB * 1024

  if (file.size <= maxBytes) {
    // Already small enough, try WebP conversion
    return convertToWebP(file)
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img
      const aspectRatio = w / h

      // Calculate new dimensions to meet size target
      // Start with 50% reduction and iterate
      let quality = 0.7
      let result = file

      const tryCompress = (targetW, targetH, q) => {
        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, targetW, targetH)

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= maxBytes) {
              resolve(blob)
            } else if (q > 0.1) {
              tryCompress(targetW, targetH, q - 0.1)
            } else if (targetW > 100) {
              // Reduce dimensions
              const newW = Math.round(targetW * 0.75)
              const newH = Math.round(newW / aspectRatio)
              tryCompress(newW, newH, 0.7)
            } else {
              resolve(result)
            }
          },
          'image/jpeg',
          q
        )
      }

      tryCompress(w, h, quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Convert a File to base64 data URL efficiently.
 * @param {File|Blob} file
 * @returns {Promise<string>} Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Estimate the size of a base64 string in KB.
 */
export function estimateBase64Size(base64String) {
  const padding = (base64String.match(/=+$/) || [''])[0].length
  const sizeBytes = ((base64String.length * 3) / 4) - padding
  return sizeBytes / 1024
}
