import { useState } from 'react'
import { api } from '../api/client'
import type { FoodItem, FoodNutritionResult, NutritionInfo } from '../api/types'
import { NutritionStrip } from '../components/NutritionStrip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

function macrosFromFood(food: FoodItem, grams: number): NutritionInfo {
  const s = grams / 100
  return {
    calories: Math.round(food.cal100 * s * 10) / 10,
    protein: Math.round(food.protein100 * s * 10) / 10,
    carbs: Math.round(food.carbs100 * s * 10) / 10,
    fat: Math.round(food.fat100 * s * 10) / 10,
    fiber: food.fiber100 != null ? Math.round(food.fiber100 * s * 10) / 10 : null,
    sodium: food.sodium100 != null ? Math.round(food.sodium100 * s * 10) / 10 : null,
    perServing: false,
  }
}

export function NutritionPage() {
  const { deviceId } = useApp()
  const [q, setQ] = useState('')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selected, setSelected] = useState<FoodNutritionResult | null>(null)
  const [grams, setGrams] = useState(100)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async () => {
    setBusy(true)
    setError(null)
    setSelected(null)
    try {
      let list = await api.searchFoods(q, 20)
      if (!list.length && q.trim()) {
        const looked = await api.lookupFood(q.trim(), deviceId)
        if (looked) list = [looked]
      }
      setFoods(list)
      if (!list.length) setError('No foods found')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  const pick = async (food: FoodItem, g = grams) => {
    setBusy(true)
    setError(null)
    try {
      const rich = await api.getFoodNutrition(food.id, g, deviceId)
      if (rich) {
        setSelected(rich)
        setGrams(rich.grams)
      } else {
        setSelected({ food, grams: g, micronutrients: [] })
      }
    } catch (e) {
      setSelected({ food, grams: g, micronutrients: [] })
      setError(e instanceof Error ? e.message : 'Micros unavailable; showing macros')
    } finally {
      setBusy(false)
    }
  }

  const macros = selected ? macrosFromFood(selected.food, selected.grams) : null

  return (
    <div>
      <PageHeader title="Nutrition" />
      <div className="px-4 py-4">
        <p className="text-sm text-muted">Search foods and scale by grams (or ml). Micros when available.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void search()
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. chicken breast"
            className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white">
            Search
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}

        <div className="mt-3 space-y-2">
          {foods.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={busy}
              onClick={() => void pick(f)}
              className="w-full rounded-xl border border-terracotta/10 bg-white px-3 py-2 text-left"
            >
              <div className="font-semibold">{f.name}</div>
              <div className="text-xs text-muted">
                {Math.round(f.cal100)} cal / 100{f.unit}
              </div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="mt-6 rounded-2xl border border-terracotta/15 bg-white p-4">
            <h3 className="font-bold">{selected.food.name}</h3>
            <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              Amount ({selected.food.unit})
              <input
                type="number"
                min={1}
                max={5000}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value) || 100)}
                className="w-24 rounded-lg border border-terracotta/20 px-2 py-1"
              />
              <button
                type="button"
                className="rounded-lg bg-chip px-3 py-1 text-sm font-semibold"
                onClick={() => void pick(selected.food, grams)}
              >
                Scale
              </button>
            </label>
            <div className="mt-3">
              <NutritionStrip nutrition={macros} label={`For ${selected.grams}${selected.food.unit}`} />
            </div>
            {selected.micronutrients.length ? (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-muted">Micronutrients</h4>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {selected.micronutrients.map((m) => (
                    <li key={m.key} className="rounded-lg bg-cream px-2 py-1">
                      <span className="text-muted">{m.label}</span>
                      <div className="font-semibold">
                        {Math.abs(m.amount - Math.round(m.amount)) < 0.05
                          ? Math.round(m.amount)
                          : m.amount.toFixed(1)}{' '}
                        {m.unit}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
