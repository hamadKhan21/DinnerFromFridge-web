import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { FoodItem } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { localDateString, useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { usePageSeo } from '../lib/documentMeta'

function fmt(v: number) {
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function macrosFromFood(food: FoodItem, grams: number) {
  const s = grams / 100
  return {
    calories: Math.round(food.cal100 * s * 10) / 10,
    protein: Math.round(food.protein100 * s * 10) / 10,
    carbs: Math.round(food.carbs100 * s * 10) / 10,
    fat: Math.round(food.fat100 * s * 10) / 10,
  }
}

function ProgressRing({
  eaten,
  target,
}: {
  eaten: number
  target: number
}) {
  const pct = target > 0 ? Math.min(1.15, eaten / target) : 0
  const r = 52
  const c = 2 * Math.PI * r
  const over = eaten > target && target > 0
  const dash = Math.min(1, pct) * c
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-chip" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={over ? 'text-missing' : 'text-terracotta'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tabular-nums text-ink">{Math.round(eaten)}</span>
        <span className="text-xs font-semibold text-muted">
          {target > 0 ? `/ ${Math.round(target)} cal` : 'cal'}
        </span>
      </div>
    </div>
  )
}

export function TodayPage() {
  const {
    deviceId,
    nutritionTargets,
    todayLog,
    todayTotals,
    caloriesRemaining,
    addCalorieEntry,
    removeCalorieEntry,
    clearTodayLog,
  } = useApp()
  const { t } = useI18n()
  const today = todayLog.date || localDateString()

  usePageSeo({
    title: 'Today’s calories | Dinner From Fridge',
    description: 'Track what you eat today against your calorie and macro targets.',
    canonical: '/today',
    noIndex: true,
  })

  const [mode, setMode] = useState<'list' | 'addFood' | 'addCustom'>('list')
  const [q, setQ] = useState('')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState(100)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  const search = useCallback(async () => {
    const query = q.trim()
    setBusy(true)
    setError(null)
    setSelected(null)
    try {
      let list = await api.searchFoods(query, 20)
      if (!list.length && query.length >= 2) {
        const looked = await api.lookupFood(query, deviceId)
        if (looked) list = [looked]
      }
      setFoods(list)
      if (!list.length) setError(t('today.noFoods'))
    } catch (e) {
      setFoods([])
      setError(e instanceof Error ? e.message : t('today.searchFailed'))
    } finally {
      setBusy(false)
    }
  }, [q, deviceId, t])

  const live = selected ? macrosFromFood(selected, grams) : null

  const addFood = () => {
    if (!selected || !live) return
    addCalorieEntry({
      name: selected.name,
      calories: live.calories,
      protein: live.protein,
      carbs: live.carbs,
      fat: live.fat,
      amountLabel: `${grams}${selected.unit || 'g'}`,
      source: 'food',
    })
    showToast(t('today.loggedCal', { n: Math.round(live.calories) }))
    setMode('list')
    setSelected(null)
    setFoods([])
    setQ('')
    setGrams(100)
  }

  const addCustom = () => {
    const name = customName.trim()
    const cal = Number(customCal)
    if (!name || !Number.isFinite(cal) || cal <= 0) {
      setError(t('today.customInvalid'))
      return
    }
    addCalorieEntry({
      name,
      calories: Math.round(cal * 10) / 10,
      protein: 0,
      carbs: 0,
      fat: 0,
      amountLabel: null,
      source: 'manual',
    })
    showToast(t('today.loggedCal', { n: Math.round(cal) }))
    setCustomName('')
    setCustomCal('')
    setError(null)
    setMode('list')
  }

  const target = nutritionTargets?.calorieTarget ?? 0
  const remainingLabel = useMemo(() => {
    if (caloriesRemaining == null) return null
    if (caloriesRemaining >= 0) return t('today.remaining', { n: caloriesRemaining })
    return t('today.over', { n: Math.abs(caloriesRemaining) })
  }, [caloriesRemaining, t])

  return (
    <div>
      <PageHeader title={t('today.title')} back />
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-muted">{formatDisplayDate(today)}</p>

        {toast ? (
          <div className="mt-3 rounded-xl bg-sage/15 px-3 py-2 text-sm font-semibold text-have">{toast}</div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-terracotta/15 bg-white p-4 shadow-sm">
          {nutritionTargets ? (
            <>
              <ProgressRing eaten={todayTotals.calories} target={target} />
              <p className="mt-2 text-center text-sm font-semibold text-ink">
                {t('today.eatenOf', {
                  eaten: Math.round(todayTotals.calories),
                  target: Math.round(target),
                })}
              </p>
              {remainingLabel ? (
                <p
                  className={`mt-1 text-center text-sm font-medium ${
                    (caloriesRemaining ?? 0) < 0 ? 'text-missing' : 'text-muted'
                  }`}
                >
                  {remainingLabel}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {(
                  [
                    {
                      key: 'P',
                      eaten: todayTotals.protein,
                      goal: nutritionTargets.proteinG,
                      label: t('today.protein'),
                    },
                    {
                      key: 'C',
                      eaten: todayTotals.carbs,
                      goal: nutritionTargets.carbsG,
                      label: t('today.carbs'),
                    },
                    {
                      key: 'F',
                      eaten: todayTotals.fat,
                      goal: nutritionTargets.fatG,
                      label: t('today.fat'),
                    },
                  ] as const
                ).map((m) => (
                  <div key={m.key} className="rounded-xl bg-cream px-2 py-2">
                    <div className="font-extrabold tabular-nums text-ink">
                      {fmt(m.eaten)}
                      <span className="font-semibold text-muted">/{Math.round(m.goal)}g</span>
                    </div>
                    <div className="mt-0.5 text-muted">{m.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-2xl font-extrabold tabular-nums text-ink">
                {Math.round(todayTotals.calories)}{' '}
                <span className="text-base font-semibold text-muted">cal</span>
              </p>
              <p className="mt-2 text-sm text-muted">{t('today.noTargets')}</p>
              <Link
                to="/goals"
                className="mt-3 inline-block rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white"
              >
                {t('today.setGoal')}
              </Link>
            </div>
          )}
        </div>

        {mode === 'list' ? (
          <>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('addFood')
                  setError(null)
                }}
                className="flex-1 rounded-2xl bg-terracotta py-3 font-semibold text-white"
              >
                {t('today.addFood')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('addCustom')
                  setError(null)
                }}
                className="rounded-2xl border border-terracotta px-4 py-3 font-semibold text-terracotta-dark"
              >
                {t('today.addCustom')}
              </button>
            </div>

            <div className="mt-3 flex gap-3 text-sm">
              <Link to="/nutrition" className="font-semibold text-terracotta">
                {t('today.browseNutrition')}
              </Link>
              <Link to="/recipes" className="font-semibold text-terracotta">
                {t('today.browseRecipes')}
              </Link>
            </div>

            <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted">
              {t('today.entries')}
            </h2>

            {!todayLog.entries.length ? (
              <div className="mt-3 rounded-2xl border border-dashed border-terracotta/20 bg-white/60 px-4 py-8 text-center">
                <p className="text-2xl" aria-hidden>
                  🍽️
                </p>
                <p className="mt-2 text-sm text-muted">{t('today.empty')}</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...todayLog.entries].reverse().map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-terracotta/10 bg-white px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{e.name}</div>
                      <div className="text-xs text-muted">
                        {e.amountLabel ? `${e.amountLabel} · ` : ''}
                        {Math.round(e.calories)} cal
                        {e.source === 'recipe' ? ` · ${t('today.sourceRecipe')}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={t('today.remove')}
                      onClick={() => removeCalorieEntry(e.id)}
                      className="rounded-lg px-2 py-1 text-sm font-semibold text-missing hover:bg-missing/10"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {todayLog.entries.length ? (
              <button
                type="button"
                onClick={() => clearTodayLog()}
                className="mt-4 w-full text-center text-sm font-semibold text-muted hover:text-missing"
              >
                {t('today.clearDay')}
              </button>
            ) : null}
          </>
        ) : null}

        {mode === 'addFood' ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setMode('list')
                setSelected(null)
                setError(null)
              }}
              className="mb-3 text-sm font-semibold text-terracotta"
            >
              ← {t('common.back')}
            </button>
            {!selected ? (
              <>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void search()
                  }}
                >
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('today.searchPlaceholder')}
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
                {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}
                {busy ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta/30 border-t-terracotta" />
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {foods.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelected(f)
                          setGrams(100)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-terracotta/10 bg-white px-3 py-2.5 text-left"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-extrabold text-terracotta-dark">
                          {Math.round(f.cal100)}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-terracotta/15 bg-white p-4">
                <h3 className="font-extrabold text-ink">{selected.name}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl bg-chip font-bold"
                    onClick={() => setGrams((g) => Math.max(1, g - 10))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={grams}
                    onChange={(e) => setGrams(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="w-24 rounded-xl border border-terracotta/20 bg-cream px-3 py-2 text-center font-bold"
                  />
                  <span className="text-sm text-muted">{selected.unit || 'g'}</span>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-xl bg-chip font-bold"
                    onClick={() => setGrams((g) => Math.min(5000, g + 10))}
                  >
                    +
                  </button>
                </div>
                {live ? (
                  <p className="mt-3 text-sm text-muted">
                    {Math.round(live.calories)} cal · P {fmt(live.protein)} · C {fmt(live.carbs)} · F{' '}
                    {fmt(live.fat)}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={addFood}
                  className="mt-4 w-full rounded-2xl bg-terracotta py-3 font-semibold text-white"
                >
                  {t('today.addToToday')}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {mode === 'addCustom' ? (
          <div className="mt-4 rounded-2xl border border-terracotta/15 bg-white p-4">
            <button
              type="button"
              onClick={() => {
                setMode('list')
                setError(null)
              }}
              className="mb-3 text-sm font-semibold text-terracotta"
            >
              ← {t('common.back')}
            </button>
            <label className="block text-sm">
              {t('today.customName')}
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2"
                placeholder={t('today.customNamePh')}
              />
            </label>
            <label className="mt-3 block text-sm">
              {t('today.customCalories')}
              <input
                type="number"
                min={1}
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
                className="mt-1 w-full rounded-xl border border-terracotta/20 bg-cream px-3 py-2"
                placeholder="250"
              />
            </label>
            {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}
            <button
              type="button"
              onClick={addCustom}
              className="mt-4 w-full rounded-2xl bg-terracotta py-3 font-semibold text-white"
            >
              {t('today.addToToday')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
