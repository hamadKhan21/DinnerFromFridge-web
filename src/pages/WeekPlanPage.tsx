import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { totalMinutes } from '../lib/servingScale'

export function WeekPlanPage() {
  const { ingredients, dietaryPreferences, deviceId, weekPlan, setWeekPlan, rememberRecipe, addShopping } =
    useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const generate = async (refresh = false) => {
    setBusy(true)
    setError(null)
    try {
      const plan = await api.weekPlan({
        ingredients: ingredients.map((i) => i.name),
        preferences: dietaryPreferences,
        deviceId,
        refresh,
        includeSides: true,
      })
      setWeekPlan(plan)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Week plan" back />
      <div className="px-4 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void generate(false)}
            className="flex-1 rounded-2xl bg-terracotta py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Generating…' : weekPlan ? 'Refresh plan' : 'Generate 7-day plan'}
          </button>
          {weekPlan ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void generate(true)}
              className="rounded-2xl border border-terracotta px-4 py-3 text-sm font-semibold text-terracotta-dark"
            >
              New
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}
        {weekPlan?.missingIngredients?.length ? (
          <div className="mt-3 rounded-xl bg-chip p-3 text-sm">
            <p className="font-semibold">Shopping from plan</p>
            <ul className="mt-1 list-disc pl-5 text-muted">
              {weekPlan.missingIngredients.slice(0, 12).map((n) => (
                <li key={n}>
                  {n}{' '}
                  <button type="button" className="text-terracotta" onClick={() => addShopping(n)}>
                    +
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          {weekPlan?.days.map((d) => (
            <div key={d.dayIndex} className="rounded-2xl border border-terracotta/10 bg-white p-4">
              <h3 className="font-bold text-terracotta">{d.dayLabel}</h3>
              {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => {
                const r = slot === 'dinner' ? d.dinner : slot === 'breakfast' ? d.breakfast : d.lunch
                if (!r) return null
                return (
                  <button
                    key={slot}
                    type="button"
                    className="mt-2 flex w-full items-center gap-2 rounded-xl bg-cream px-3 py-2 text-left"
                    onClick={() => {
                      rememberRecipe(r)
                      navigate(`/recipe/${encodeURIComponent(r.id)}`, { state: { recipe: r } })
                    }}
                  >
                    <span>{r.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs uppercase text-muted">{slot}</div>
                      <div className="truncate font-semibold">{r.title}</div>
                      <div className="text-xs text-muted">~{totalMinutes(r)} min</div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
