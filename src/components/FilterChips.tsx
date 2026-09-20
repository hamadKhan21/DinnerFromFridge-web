import type { TonightFilters } from '../api/types'

export function FilterChips({
  filters,
  disabled,
  onChange,
}: {
  filters: TonightFilters
  disabled?: boolean
  onChange: (f: TonightFilters) => void
}) {
  const toggleMax = (m: number) => {
    onChange({ ...filters, maxMinutes: filters.maxMinutes === m ? null : m })
  }
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium border transition ${
      active
        ? 'border-terracotta bg-terracotta/15 text-terracotta-dark'
        : 'border-transparent bg-chip text-ink'
    } ${disabled ? 'opacity-50' : ''}`

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} className={chip(filters.maxMinutes === 15)} onClick={() => toggleMax(15)}>
        ≤15 min
      </button>
      <button type="button" disabled={disabled} className={chip(filters.maxMinutes === 30)} onClick={() => toggleMax(30)}>
        ≤30 min
      </button>
      <button
        type="button"
        disabled={disabled}
        className={chip(!!filters.onePan)}
        onClick={() => onChange({ ...filters, onePan: !filters.onePan })}
      >
        One pan
      </button>
      <button
        type="button"
        disabled={disabled}
        className={chip(!!filters.airFryer)}
        onClick={() => onChange({ ...filters, airFryer: !filters.airFryer })}
      >
        Air fryer
      </button>
      <button
        type="button"
        disabled={disabled}
        className={chip(!!filters.noOven)}
        onClick={() => onChange({ ...filters, noOven: !filters.noOven })}
      >
        No oven
      </button>
      {(filters.maxMinutes != null || filters.onePan || filters.airFryer || filters.noOven) && (
        <button
          type="button"
          disabled={disabled}
          className="rounded-full bg-white px-3 py-1.5 text-sm text-muted underline"
          onClick={() => onChange({})}
        >
          Clear
        </button>
      )}
    </div>
  )
}
