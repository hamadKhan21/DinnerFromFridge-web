import { useState } from 'react'
import { api } from '../api/client'
import type { DietPlan } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

export function GoalsPage() {
  const { goal, setGoal, deviceId } = useApp()
  const [weightKg, setWeightKg] = useState(goal?.weightKg ?? 80)
  const [goalWeightKg, setGoalWeightKg] = useState(goal?.goalWeightKg ?? 75)
  const [heightCm, setHeightCm] = useState(goal?.heightCm ?? 170)
  const [age, setAge] = useState(goal?.age ?? 30)
  const [sex, setSex] = useState(goal?.sex ?? '')
  const [activity, setActivity] = useState(goal?.activity ?? 'moderate')
  const [plan, setPlan] = useState<DietPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveAndPlan = async () => {
    setBusy(true)
    setError(null)
    const g = {
      weightKg,
      goalWeightKg,
      heightCm,
      age,
      sex: sex || null,
      activity,
      unitSystem: 'metric',
      updatedAtMillis: Date.now(),
    }
    setGoal(g)
    try {
      const p = await api.nutritionPlan({
        weightKg,
        goalWeightKg,
        heightCm,
        age,
        sex: sex || undefined,
        activity,
        deviceId,
      })
      setPlan(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Goals" />
      <div className="px-4 py-4">
        <p className="text-sm text-muted">Fat-loss targets and a daily meal sketch from the Worker.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Weight (kg)
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Goal (kg)
            <input
              type="number"
              value={goalWeightKg}
              onChange={(e) => setGoalWeightKg(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Height (cm)
            <input
              type="number"
              value={heightCm ?? ''}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Age
            <input
              type="number"
              value={age ?? ''}
              onChange={(e) => setAge(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Sex
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="mt-3 block text-sm">
          Activity
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="mt-1 w-full rounded-xl border border-terracotta/20 bg-white px-3 py-2"
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very_active">Very active</option>
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveAndPlan()}
          className="mt-5 w-full rounded-2xl bg-terracotta py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Calculating…' : 'Save & get plan'}
        </button>
        {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}

        {plan ? (
          <div className="mt-6 rounded-2xl border border-terracotta/15 bg-white p-4">
            <h3 className="font-bold">Daily targets</h3>
            <p className="mt-1 text-sm text-muted">
              {Math.round(plan.calorieTarget)} cal · {Math.round(plan.proteinG)}g protein ·{' '}
              {Math.round(plan.carbsG)}g carbs · {Math.round(plan.fatG)}g fat
            </p>
            <ul className="mt-4 space-y-2">
              {plan.meals.map((m, i) => (
                <li key={i} className="rounded-xl bg-cream px-3 py-2 text-sm">
                  <span className="text-xs uppercase text-muted">{m.slot}</span>
                  <div className="font-semibold">
                    {m.emoji ? `${m.emoji} ` : ''}
                    {m.title}
                  </div>
                  <div className="text-xs text-muted">{Math.round(m.calories)} cal</div>
                </li>
              ))}
            </ul>
            {plan.notes ? <p className="mt-3 text-xs text-muted">{plan.notes}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
