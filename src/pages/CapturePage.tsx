import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PaywallError, type ApiErrorKind } from '../api/types'
import { ErrorNotice } from '../components/ErrorNotice'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { errorKind } from '../lib/friendlyError'
import { prepareImageBase64 } from '../lib/imagePrepare'
import { usePageSeo } from '../lib/documentMeta'
import { takePendingScan } from '../lib/pendingScan'
import { clearFridgeThumb, saveFridgeThumb } from '../lib/storyCard'

export function CapturePage() {
  const { deviceId, setIngredients, setQuota } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiErrorKind | null>(null)
  const lastFileRef = useRef<File | null>(null)

  usePageSeo({
    title: 'Scan your fridge | Dinner From Fridge',
    description: 'Snap a fridge or pantry photo to get ingredient suggestions and dinner ideas from what you already have.',
    canonical: '/capture',
  })

  const runScan = async (file: File) => {
    lastFileRef.current = file
    setBusy(true)
    setError(null)
    try {
      const { imageBase64, mimeType } = await prepareImageBase64(file)
      clearFridgeThumb()
      const result = await api.scan(deviceId, imageBase64, mimeType)
      // Small copy of the photo for the optional story card (stays in this tab only)
      await saveFridgeThumb(imageBase64)
      setQuota(result.remaining, result.used, result.limit)
      setIngredients(result.ingredients)
      navigate('/ingredients', { replace: true })
    } catch (e) {
      if (e instanceof PaywallError) {
        navigate('/paywall')
      } else {
        // Only friendly, localized copy — never raw error text.
        setError(errorKind(e))
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // Photo picked from the Home "Snap your fridge" button
  useEffect(() => {
    const f = takePendingScan()
    if (f) void runScan(f)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title={t('capture.title')} back />
      <div className="px-6 py-6">
        <h2 className="text-2xl font-bold text-ink">{t('capture.heading')}</h2>
        <p className="mt-2 text-muted">{t('capture.subtitle')}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void runScan(f)
          }}
        />

        {busy ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
            <p>{t('capture.scanning')}</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl bg-terracotta px-5 py-4 font-semibold text-white"
            >
              {t('capture.choosePhoto')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ingredients')}
              className="w-full rounded-2xl border border-terracotta px-5 py-3 font-semibold text-terracotta-dark"
            >
              {t('capture.skip')}
            </button>
          </div>
        )}

        {error && !busy ? (
          <>
            <ErrorNotice
              kind={error}
              showAlternatives
              onRetry={
                lastFileRef.current && error !== 'bad_image'
                  ? () => {
                      const f = lastFileRef.current
                      if (f) void runScan(f)
                    }
                  : undefined
              }
            />
            {error === 'busy' || error === 'unavailable' || error === 'bad_image' || error === 'offline' ? (
              <p className="mt-2 text-xs text-muted">{t('err.noScanUsed')}</p>
            ) : null}
          </>
        ) : null}
        {!busy && !error ? (
          <Link to="/sample-fridge" className="mt-5 block text-center text-sm font-semibold text-terracotta">
            ✨ {t('hero.trySample')}
          </Link>
        ) : null}
        <p className="mt-6 text-xs text-muted">{t('capture.quotaNote')}</p>
      </div>
    </div>
  )
}
