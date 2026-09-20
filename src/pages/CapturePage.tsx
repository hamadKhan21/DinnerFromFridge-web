import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PaywallError } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { prepareImageBase64, truncateError } from '../lib/imagePrepare'

export function CapturePage() {
  const { deviceId, setIngredients, setQuota } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runScan = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const { imageBase64, mimeType } = await prepareImageBase64(file)
      const result = await api.scan(deviceId, imageBase64, mimeType)
      setQuota(result.remaining, result.used, result.limit)
      setIngredients(result.ingredients)
      navigate('/ingredients', { replace: true })
    } catch (e) {
      if (e instanceof PaywallError) {
        navigate('/paywall')
      } else {
        const raw = e instanceof Error ? e.message : 'Scan failed'
        const lower = raw.toLowerCase()
        if (
          lower.includes('could not read') ||
          lower.includes('decode') ||
          lower.includes('empty') ||
          lower.includes('heic') ||
          lower.includes('unsupported')
        ) {
          setError(t('capture.photoError'))
        } else {
          setError(truncateError(raw))
        }
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

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

        {error ? <p className="mt-4 text-sm text-missing">{error}</p> : null}
        <p className="mt-6 text-xs text-muted">{t('capture.quotaNote')}</p>
      </div>
    </div>
  )
}
