import { Link } from 'react-router-dom'
import type { ApiErrorKind } from '../api/types'
import { useI18n } from '../i18n/I18nContext'
import { isRetryable } from '../lib/friendlyError'

/**
 * Friendly, localized error box. Takes a stable error kind — never a raw
 * error string — so provider names, status codes or JSON can't leak to users.
 */
export function ErrorNotice({
  kind,
  onRetry,
  showAlternatives = false,
  className = '',
}: {
  kind: ApiErrorKind
  onRetry?: () => void
  /** Suggest the sample fridge / typing ingredients (scan & smart lookup flows). */
  showAlternatives?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const canRetry = !!onRetry && isRetryable(kind)
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mt-4 rounded-2xl border border-missing/30 bg-missing/5 px-4 py-3 text-sm text-ink ${className}`}
    >
      <p className="font-semibold">{t(`err.${kind}`)}</p>
      {showAlternatives ? <p className="mt-1 text-muted">{t('err.alternatives')}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {canRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white"
          >
            {t('err.tryAgain')}
          </button>
        ) : null}
        {showAlternatives ? (
          <>
            <Link
              to="/sample-fridge"
              className="rounded-xl border border-terracotta px-4 py-2 font-semibold text-terracotta-dark"
            >
              {t('hero.trySample')}
            </Link>
            <Link
              to="/ingredients"
              className="rounded-xl border border-terracotta px-4 py-2 font-semibold text-terracotta-dark"
            >
              {t('err.typeIngredients')}
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
