import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'

/** Compact summary when dietary prefs are active. */
export function ActiveDietBar() {
  const { dietaryPreferences, setDietaryPreferences } = useApp()
  const { t } = useI18n()
  if (!dietaryPreferences.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-terracotta/10 bg-chip/40 px-4 py-2 text-xs">
      <span className="font-semibold text-muted">Diet:</span>
      {dietaryPreferences.map((p) => (
        <span key={p} className="rounded-full bg-terracotta/15 px-2 py-0.5 text-terracotta-dark">
          {t(`pref.${p}`)}
        </span>
      ))}
      <button
        type="button"
        className="text-muted underline"
        onClick={() => setDietaryPreferences([])}
      >
        Clear
      </button>
      <Link to="/settings" className="ms-auto text-terracotta underline">
        Settings
      </Link>
    </div>
  )
}
