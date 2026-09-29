import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/I18nContext'

export function whatsappUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`.trim())}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

function isIos(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Bottom sheet that renders a story image up-front (so Share keeps the tap's user activation on iOS),
 * then offers Share image / WhatsApp / Copy link / Save image.
 */
export function ShareSheet({
  open,
  onClose,
  title,
  makeImage,
  url,
  text,
  fileName = 'dinner-from-fridge.jpg',
  renderKey = '',
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  makeImage: () => Promise<Blob>
  url: string
  text: string
  fileName?: string
  /** change to regenerate the image (e.g. photo toggle) */
  renderKey?: string
  children?: ReactNode
}) {
  const { t } = useI18n()
  const [blob, setBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const makeRef = useRef(makeImage)
  useEffect(() => {
    makeRef.current = makeImage
  })

  useEffect(() => {
    if (!open) return
    let alive = true
    let objectUrl: string | null = null
    setBusy(true)
    setBlob(null)
    setPreview(null)
    makeRef
      .current()
      .then((b) => {
        if (!alive) return
        objectUrl = URL.createObjectURL(b)
        setBlob(b)
        setPreview(objectUrl)
      })
      .catch(() => {
        if (alive) setMsg(t('share.imageFailed'))
      })
      .finally(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, renderKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const file = blob ? new File([blob], fileName, { type: blob.type || 'image/jpeg' }) : null
  const canShareFile =
    !!file && typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const flash = (m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(null), 2500)
  }

  const onShareImage = async () => {
    if (!file) return
    try {
      if (canShareFile) {
        await navigator.share({ files: [file], title, text: `${text} ${url}` })
        return
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
    onDownload()
  }

  const onDownload = () => {
    if (!preview) return
    const a = document.createElement('a')
    a.href = preview
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    if (isIos()) flash(t('share.longPressHint'))
    else flash(t('share.saved'))
  }

  const onCopy = async () => {
    const ok = await copyToClipboard(url)
    flash(ok ? t('share.linkCopied') : url)
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-warm-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-chip" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-muted hover:bg-chip" aria-label={t('share.close')}>
            ✕
          </button>
        </div>

        <div className="mt-3 flex justify-center">
          {preview ? (
            <img src={preview} alt={title} className="h-[44dvh] max-h-[460px] rounded-2xl shadow-md" style={{ aspectRatio: '9 / 16' }} />
          ) : (
            <div className="flex h-[44dvh] max-h-[460px] items-center justify-center rounded-2xl bg-chip/60" style={{ aspectRatio: '9 / 16' }}>
              {busy ? <div className="h-8 w-8 animate-spin rounded-full border-4 border-chip border-t-terracotta" /> : null}
            </div>
          )}
        </div>

        {children ? <div className="mt-3">{children}</div> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!file}
            onClick={() => void onShareImage()}
            className="col-span-2 rounded-2xl bg-terracotta py-3.5 font-bold text-white shadow disabled:opacity-50"
          >
            {canShareFile ? `📤 ${t('share.shareImage')}` : `⬇️ ${t('share.saveImage')}`}
          </button>
          <a
            href={whatsappUrl(text, url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-2xl bg-[#25D366] py-3 font-bold text-white"
          >
            💬 WhatsApp
          </a>
          <button type="button" onClick={() => void onCopy()} className="rounded-2xl border border-terracotta py-3 font-bold text-terracotta-dark">
            🔗 {t('share.copyLink')}
          </button>
          {canShareFile ? (
            <button type="button" disabled={!file} onClick={onDownload} className="col-span-2 py-2 text-sm font-semibold text-muted underline disabled:opacity-50">
              {t('share.saveImage')}
            </button>
          ) : null}
        </div>
        {msg ? <p className="mt-2 text-center text-sm font-semibold text-have">{msg}</p> : null}
        <p className="mt-2 text-center text-xs text-muted">{t('share.privacy')}</p>
      </div>
    </div>,
    document.body,
  )
}
