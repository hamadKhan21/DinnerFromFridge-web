const MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

function stripDataUrlPrefix(dataUrlOrB64: string): string {
  const s = dataUrlOrB64.trim()
  return s.includes(',') ? s.split(',')[1]! : s
}

function scaleDimensions(width: number, height: number, maxEdge: number): { w: number; h: number } {
  const edge = Math.max(width, height)
  if (edge <= maxEdge) return { w: width, h: height }
  const scale = maxEdge / edge
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToJpegBase64(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string> {
  return new Promise((resolve, reject) => {
    if (canvas instanceof OffscreenCanvas) {
      canvas
        .convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
        .then(async (blob) => {
          const buf = await blob.arrayBuffer()
          const bytes = new Uint8Array(buf)
          let binary = ''
          const chunk = 0x8000
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
          }
          resolve(btoa(binary))
        })
        .catch(reject)
      return
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not encode JPEG'))
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          const b64 = stripDataUrlPrefix(String(reader.result ?? ''))
          if (!b64) reject(new Error('Empty JPEG output'))
          else resolve(b64)
        }
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

async function decodeViaImageBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number) => void; close?: () => void }> {
  const bitmap = await createImageBitmap(file)
  return {
    width: bitmap.width,
    height: bitmap.height,
    draw: (ctx, w, h) => {
      ctx.drawImage(bitmap, 0, 0, w, h)
    },
    close: () => bitmap.close(),
  }
}

function decodeViaHtmlImage(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number) => void; close?: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        draw: (ctx, w, h) => {
          ctx.drawImage(img, 0, 0, w, h)
        },
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image decode failed'))
    }
    img.src = url
  })
}

async function fileToJpegViaCanvas(file: File): Promise<string> {
  let decoded: Awaited<ReturnType<typeof decodeViaImageBitmap>>
  try {
    decoded = await decodeViaImageBitmap(file)
  } catch {
    decoded = await decodeViaHtmlImage(file)
  }

  try {
    const { w, h } = scaleDimensions(decoded.width, decoded.height, MAX_EDGE)
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('OffscreenCanvas 2d unavailable')
      decoded.draw(ctx, w, h)
      return await canvasToJpegBase64(canvas)
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2d unavailable')
    decoded.draw(ctx, w, h)
    return await canvasToJpegBase64(canvas)
  } finally {
    decoded.close?.()
  }
}

function fileToBase64Fallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = stripDataUrlPrefix(String(reader.result ?? ''))
      if (!b64) reject(new Error('Empty image data'))
      else resolve(b64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

/** Decode photo → resize → JPEG base64 (no data-URL prefix). */
export async function prepareImageBase64(file: File): Promise<{ imageBase64: string; mimeType: 'image/jpeg' }> {
  try {
    const imageBase64 = await fileToJpegViaCanvas(file)
    if (!imageBase64 || imageBase64.length < 32) {
      throw new Error('Empty JPEG output')
    }
    return { imageBase64, mimeType: 'image/jpeg' }
  } catch (canvasErr) {
    try {
      const imageBase64 = await fileToBase64Fallback(file)
      if (!imageBase64 || imageBase64.length < 32) {
        throw new Error('Empty image data')
      }
      // Fallback may still be HEIC/WebP; caller surfaces a clear error if scan fails.
      return { imageBase64, mimeType: 'image/jpeg' }
    } catch {
      const msg =
        canvasErr instanceof Error && canvasErr.message
          ? canvasErr.message
          : 'Could not read that photo — try JPG/PNG'
      throw new Error(
        msg.includes('Could not read') || msg.includes('decode') || msg.includes('Empty')
          ? 'Could not read that photo — try JPG/PNG'
          : 'Could not read that photo — try JPG/PNG',
      )
    }
  }
}

export function truncateError(msg: string, max = 180): string {
  const t = msg.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}
