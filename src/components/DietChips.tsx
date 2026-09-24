import { DIET_PREF_OPTIONS } from '../lib/dietPrefs'
import { useI18n } from '../i18n/I18nContext'

export function DietChips({
  selected,
  onChange,
  disabled,
  compact,
}: {
  selected: string[]
  onChange: (prefs: string[]) => void
  disabled?: boolean
  compact?: boolean
}) {
  const { t } = useI18n()

  const toggle = (p: string) => {
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p])
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium border transition ${
      active
        ? 'border-terracotta bg-terracotta/15 text-terracotta-dark'
        : 'border-transparent bg-chip text-ink'
    } ${disabled ? 'opacity-50' : ''} ${compact ? 'px-2.5 py-1 text-xs' : ''}`

  return (
    <div className="flex flex-wrap gap-2">
      {DIET_PREF_OPTIONS.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          className={chip(selected.includes(p))}
          onClick={() => toggle(p)}
        >
          {t(`pref.${p}`)}
        </button>
      ))}
      {selected.length > 0 ? (
        <button
          type="button"
          disabled={disabled}
          className="rounded-full bg-white px-3 py-1.5 text-sm text-muted underline"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
