import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { formatMoney, useStreakStats } from '../lib/streaks'

export function StreakCard() {
  const { t } = useI18n()
  const s = useStreakStats()
  return (
    <Link to="/streak" className="mt-4 flex items-center gap-3 rounded-2xl border border-terracotta/20 bg-white px-4 py-3.5 shadow-sm">
      <span className="text-2xl" aria-hidden>
        🔥
      </span>
      <div className="min-w-0 flex-1">
        {s.total ? (
          <>
            <div className="font-bold text-ink">
              {t('streak.weekStreakShort', { n: s.weekStreak })} · {t('streak.thisWeekShort', { n: s.thisWeek })}
            </div>
            <div className="text-sm text-muted">
              {t('streak.savedShort', { amount: formatMoney(s.saved, s.settings.currency) })}
            </div>
          </>
        ) : (
          <>
            <div className="font-bold text-ink">{t('streak.startTitle')}</div>
            <div className="text-sm text-muted">{t('streak.startHint')}</div>
          </>
        )}
      </div>
      <span className="text-muted" aria-hidden>
        ›
      </span>
    </Link>
  )
}
