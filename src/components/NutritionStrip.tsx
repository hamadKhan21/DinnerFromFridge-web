import type { NutritionInfo } from '../api/types'

function fmt(v: number) {
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)
}

/** Compact one-line strip for recipe cards. */
export function NutritionStrip({ nutrition, label }: { nutrition?: NutritionInfo | null; label?: string }) {
  if (!nutrition) return null
  const has = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0
  if (!has) return null
  return (
    <div className="rounded-xl bg-sage/10 px-3 py-2 text-sm text-ink">
      {label ? <div className="mb-1 text-xs font-semibold text-muted">{label}</div> : null}
      <div className="flex flex-wrap gap-3">
        <span>{Math.round(nutrition.calories)} cal</span>
        <span>{fmt(nutrition.protein)}g protein</span>
        <span>{fmt(nutrition.carbs)}g carbs</span>
        <span>{fmt(nutrition.fat)}g fat</span>
        {nutrition.fiber != null ? <span>{fmt(nutrition.fiber)}g fiber</span> : null}
        {nutrition.sodium != null ? <span>{fmt(nutrition.sodium)}mg sodium</span> : null}
      </div>
    </div>
  )
}

type MacroTone = 'terracotta' | 'have' | 'sage' | 'missing' | 'muted' | 'ink'

const TONE: Record<MacroTone, string> = {
  terracotta: 'bg-terracotta/12 text-terracotta',
  have: 'bg-have/12 text-have',
  sage: 'bg-sage/15 text-sage',
  missing: 'bg-missing/12 text-missing',
  muted: 'bg-muted/10 text-muted',
  ink: 'bg-ink/8 text-ink/70',
}

function MacroPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: MacroTone
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-3 py-3 ${TONE[tone]}`}>
      <span className="text-lg font-extrabold leading-tight tabular-nums">{value}</span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide opacity-90">{label}</span>
    </div>
  )
}

/** Large macro cards matching Flutter NutritionCard / Food Calc. */
export function MacroCards({
  nutrition,
  label,
}: {
  nutrition?: NutritionInfo | null
  label?: string
}) {
  if (!nutrition) return null
  const has = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0
  if (!has) return null

  const extras: { label: string; value: string; tone: MacroTone }[] = []
  if (nutrition.fiber != null) {
    extras.push({ label: 'Fiber', value: `${fmt(nutrition.fiber)}g`, tone: 'muted' })
  }
  if (nutrition.sodium != null) {
    extras.push({ label: 'Sodium', value: `${fmt(nutrition.sodium)}mg`, tone: 'ink' })
  }

  return (
    <div className="rounded-2xl border border-sage/20 bg-sage/8 p-3">
      {label ? (
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <span aria-hidden>❤️</span>
          <span>{label}</span>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MacroPill label="Cal" value={`${Math.round(nutrition.calories)}`} tone="terracotta" />
        <MacroPill label="Protein" value={`${fmt(nutrition.protein)}g`} tone="have" />
        <MacroPill label="Carbs" value={`${fmt(nutrition.carbs)}g`} tone="sage" />
        <MacroPill label="Fat" value={`${fmt(nutrition.fat)}g`} tone="missing" />
      </div>
      {extras.length ? (
        <div className="mt-2 flex gap-2">
          {extras.map((e) => (
            <MacroPill key={e.label} label={e.label} value={e.value} tone={e.tone} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
