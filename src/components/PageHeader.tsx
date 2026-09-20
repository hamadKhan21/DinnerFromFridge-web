import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export function PageHeader({ title, back }: { title: string; back?: boolean }) {
  const navigate = useNavigate()
  const { t, dir } = useI18n()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-terracotta/10 bg-cream/95 px-4 py-3 backdrop-blur">
      {back ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-2 py-1 text-terracotta hover:bg-chip"
          aria-label={t('common.back')}
        >
          {dir === 'rtl' ? '→' : '←'}
        </button>
      ) : null}
      <h1 className="text-lg font-bold text-ink">{title}</h1>
    </header>
  )
}
