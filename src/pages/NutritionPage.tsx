import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { FoodItem, FoodNutritionResult, MicroNutrient, NutritionInfo } from '../api/types'
import { MacroCards } from '../components/NutritionStrip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'

type Tab = 'calc' | 'micros'

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

function scaleMicros(list: MicroNutrient[], fromGrams: number, toGrams: number): MicroNutrient[] {
  if (!list.length || fromGrams <= 0) return list
  const factor = toGrams / fromGrams
  return list.map((m) => {
    const per100 = m.per100g
    if (per100 != null && Number.isFinite(per100)) {
      return { ...m, amount: Math.round(per100 * (toGrams / 100) * 1000) / 1000 }
    }
    return { ...m, amount: Math.round(m.amount * factor * 1000) / 1000 }
  })
}

function fmtAmount(v: number) {
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)
}

function AmountStepper({
  unit,
  grams,
  onChange,
  onReset,
}: {
  unit: string
  grams: number
  onChange: (g: number) => void
  onReset: () => void
}) {
  const clamp = (n: number) => Math.min(5000, Math.max(1, Math.round(n)))
  const step = unit === 'ml' ? 10 : 10

  return (
    <div className="rounded-2xl border border-terracotta/15 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Amount ({unit})
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease by ${step}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip text-lg font-bold text-terracotta-dark active:scale-95"
          onClick={() => onChange(clamp(grams - step))}
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={5000}
          value={grams}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isFinite(n)) return
            onChange(clamp(n))
          }}
          className="w-24 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 text-center text-lg font-bold tabular-nums outline-none focus:border-terracotta"
        />
        <button
          type="button"
          aria-label={`Increase by ${step}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip text-lg font-bold text-terracotta-dark active:scale-95"
          onClick={() => onChange(clamp(grams + step))}
        >
          +
        </button>
        <button
          type="button"
          className="ml-auto rounded-xl bg-terracotta px-3 py-2 text-sm font-semibold text-white"
          onClick={onReset}
        >
          100{unit}
        </button>
      </div>
      <input
        type="range"
        min={10}
        max={500}
        step={5}
        value={Math.min(500, Math.max(10, grams))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-terracotta"
        aria-label="Amount slider"
      />
    </div>
  )
}

function FoodResultRow({
  food,
  onPick,
  busy,
  subtitle,
}: {
  food: FoodItem
  onPick: () => void
  busy: boolean
  subtitle: string
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-xl border border-terracotta/10 bg-white px-3 py-2.5 text-left transition hover:border-terracotta/30 active:bg-chip/40 disabled:opacity-60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-extrabold text-terracotta-dark tabular-nums">
        {Math.round(food.cal100)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{food.name}</span>
        <span className="block truncate text-xs text-muted">{subtitle}</span>
      </span>
      <span className="text-muted" aria-hidden>
        ›
      </span>
    </button>
  )
}

function MicrosGrid({ micros, emptyHint }: { micros: MicroNutrient[]; emptyHint: string }) {
  if (!micros.length) {
    return <p className="text-sm text-muted">{emptyHint}</p>
  }
  return (
    <ul className="grid grid-cols-2 gap-2 text-sm">
      {micros.map((m, i) => (
        <li
          key={m.key}
          className={`rounded-xl px-3 py-2 ${i === 0 ? 'bg-terracotta/10' : 'bg-cream'}`}
        >
          <span className={`text-xs ${i === 0 ? 'font-semibold text-terracotta' : 'text-muted'}`}>
            {m.label}
          </span>
          <div className={`font-bold tabular-nums ${i === 0 ? 'text-terracotta' : 'text-ink'}`}>
            {fmtAmount(m.amount)} {m.unit}
          </div>
        </li>
      ))}
    </ul>
  )
}

function StatusBlock({
  loading,
  error,
  empty,
  emptyHint,
}: {
  loading: boolean
  error: string | null
  empty: boolean
  emptyHint: string
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta/30 border-t-terracotta" />
        <p className="text-sm">Searching…</p>
      </div>
    )
  }
  if (error && empty) {
    return (
      <div className="rounded-2xl border border-missing/20 bg-missing/5 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-missing">{error}</p>
      </div>
    )
  }
  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-terracotta/20 bg-white/60 px-4 py-10 text-center">
        <p className="text-2xl" aria-hidden>
          🥗
        </p>
        <p className="mt-2 text-sm text-muted">{emptyHint}</p>
      </div>
    )
  }
  return null
}

export function NutritionPage() {
  const { deviceId } = useApp()
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('calc')

  // Shared search state per tab would be nicer, but keep simple independent queries
  const [q, setQ] = useState('')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selected, setSelected] = useState<FoodNutritionResult | null>(null)
  const [grams, setGrams] = useState(100)
  const [busy, setBusy] = useState(false)
  const [detailBusy, setDetailBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Reset selection when switching tabs to avoid confusing UX
  useEffect(() => {
    setSelected(null)
    setFoods([])
    setError(null)
    setSearched(false)
    setQ('')
    setGrams(100)
  }, [tab])

  const search = useCallback(async () => {
    const query = q.trim()
    setBusy(true)
    setError(null)
    setSelected(null)
    setSearched(true)
    try {
      let list = await api.searchFoods(query, 25)
      if (!list.length && query.length >= 2) {
        const looked = await api.lookupFood(query, deviceId)
        if (looked) list = [looked]
      }
      setFoods(list)
      if (!list.length) setError(query ? `No foods found for “${query}”.` : 'No foods found')
    } catch (e) {
      setFoods([])
      setError(e instanceof Error ? e.message : 'Search failed. Check your connection.')
    } finally {
      setBusy(false)
    }
  }, [q, deviceId])

  const pick = useCallback(
    async (food: FoodItem, g = grams) => {
      const amount = Math.min(5000, Math.max(1, Math.round(g)))
      setDetailBusy(true)
      setError(null)
      // Optimistic detail so the list is replaced immediately
      setSelected({ food, grams: amount, micronutrients: [] })
      setGrams(amount)
      try {
        const rich = await api.getFoodNutrition(food.id, amount, deviceId)
        if (rich) {
          setSelected(rich)
          setGrams(rich.grams)
        } else {
          setSelected({ food, grams: amount, micronutrients: [] })
        }
      } catch (e) {
        setSelected({ food, grams: amount, micronutrients: [] })
        if (tab === 'micros') {
          setError(e instanceof Error ? e.message : 'Could not load micronutrients')
        }
      } finally {
        setDetailBusy(false)
      }
    },
    [grams, deviceId, tab],
  )

  const backToResults = () => {
    setSelected(null)
    setDetailBusy(false)
    setError(null)
  }

  const liveMacros = selected ? macrosFromFood(selected.food, grams) : null
  const liveMicros = useMemo(() => {
    if (!selected) return []
    return scaleMicros(selected.micronutrients, selected.grams, grams)
  }, [selected, grams])

  const unit = selected?.food.unit ?? 'g'
  const emptyHint =
    tab === 'calc'
      ? t('nutrition.emptyCalc')
      : t('nutrition.emptyMicros')

  return (
    <div>
      <PageHeader title={t('nutrition.title')} />
      <div className="px-4 py-3">
        {/* Tabs */}
        <div className="flex rounded-2xl bg-chip/70 p-1">
          {(
            [
              { id: 'calc' as const, label: t('nutrition.foodCalc') },
              { id: 'micros' as const, label: t('nutrition.micros') },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tab === t.id ? 'bg-white text-terracotta shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!selected ? (
          <>
            <p className="mt-3 text-sm text-muted">
              {tab === 'calc'
                ? t('nutrition.calcHint')
                : t('nutrition.microsHint')}
            </p>
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
                placeholder={tab === 'calc' ? t('nutrition.placeholderCalc') : t('nutrition.placeholderMicros')}
                className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2.5 outline-none focus:border-terracotta"
                enterKeyHint="search"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-terracotta px-4 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {t('common.search')}
              </button>
            </form>
            {error && foods.length ? <p className="mt-2 text-sm text-missing">{error}</p> : null}

            <div className="mt-3">
              <StatusBlock
                loading={busy}
                error={error}
                empty={!foods.length}
                emptyHint={searched ? (error ?? t('nutrition.noMatches')) : emptyHint}
              />
              {!busy && foods.length ? (
                <div className="space-y-2">
                  {foods.map((f) => (
                    <FoodResultRow
                      key={f.id}
                      food={f}
                      busy={detailBusy}
                      onPick={() => void pick(f)}
                      subtitle={
                        tab === 'calc'
                          ? `${Math.round(f.cal100)} cal / 100${f.unit} · P ${fmtAmount(f.protein100)} · C ${fmtAmount(f.carbs100)} · F ${fmtAmount(f.fat100)}`
                          : t('nutrition.tapMicros')
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={backToResults}
              className="mb-3 inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold text-terracotta hover:bg-chip"
            >
              ← Change food
            </button>

            <div className="rounded-2xl border border-terracotta/15 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-extrabold leading-snug text-ink">{selected.food.name}</h2>
              <p className="mt-0.5 text-xs text-muted">
                {Math.round(selected.food.cal100)} cal per 100{selected.food.unit}
              </p>

              {tab === 'calc' ? (
                <>
                  <div className="mt-4">
                    <AmountStepper
                      unit={unit}
                      grams={grams}
                      onChange={setGrams}
                      onReset={() => setGrams(100)}
                    />
                  </div>
                  <div className="mt-4">
                    <MacroCards
                      nutrition={liveMacros}
                      label={`For ${grams}${unit}`}
                    />
                  </div>
                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-bold text-muted">Micronutrients</h3>
                    {detailBusy ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-muted">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-terracotta/30 border-t-terracotta" />
                        Loading nutrients…
                      </div>
                    ) : (
                      <MicrosGrid
                        micros={liveMicros}
                        emptyHint="No micronutrient data for this food yet."
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4">
                    <AmountStepper
                      unit={unit}
                      grams={grams}
                      onChange={setGrams}
                      onReset={() => setGrams(100)}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-sage">
                    Vitamins & minerals for {grams}
                    {unit}
                  </p>
                  <div className="mt-3">
                    {detailBusy ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-terracotta/30 border-t-terracotta" />
                        Loading nutrients…
                      </div>
                    ) : (
                      <MicrosGrid
                        micros={liveMicros}
                        emptyHint={
                          error ?? 'No micronutrient data for this food yet.'
                        }
                      />
                    )}
                  </div>
                  {liveMacros ? (
                    <div className="mt-5">
                      <h3 className="mb-2 text-sm font-bold text-muted">Macros at a glance</h3>
                      <MacroCards nutrition={liveMacros} />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
