import type { NutritionInfo } from '../api/types'

export function NutritionStrip({ nutrition, label }: { nutrition?: NutritionInfo | null; label?: string }) {
  if (!nutrition) return null
  const has = nutrition.calories > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0
  if (!has) return null
  const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1))
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
