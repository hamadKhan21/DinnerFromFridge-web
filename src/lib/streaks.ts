import { useCallback, useEffect, useState } from 'react'
import { loadJson, saveJson } from './storage'

/** Home-cooked dinner log — stays on this device. */
export interface CookedEntry {
  date: string // YYYY-MM-DD local
  recipeId?: string | null
  title: string
  at: number
}

export interface SavingsSettings {
  perMeal: number
  currency: string
}

const K_LOG = 'dff_cooked_log'
const K_SAVE = 'dff_savings_settings'
const EVT = 'dff-cooked-change'
export const DEFAULT_SAVINGS: SavingsSettings = { perMeal: 12, currency: '$' }

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

/** Monday-based week key. */
function weekStart(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow)
  return localDate(x)
}

export function loadCookedLog(): CookedEntry[] {
  const raw = loadJson<CookedEntry[]>(K_LOG, [])
  return Array.isArray(raw) ? raw.filter((e) => e && typeof e.date === 'string') : []
}

export function loadSavingsSettings(): SavingsSettings {
  const s = loadJson<Partial<SavingsSettings>>(K_SAVE, {})
  const perMeal = typeof s.perMeal === 'number' && s.perMeal >= 0 && s.perMeal < 1000 ? s.perMeal : DEFAULT_SAVINGS.perMeal
  const currency = typeof s.currency === 'string' && s.currency.trim() ? s.currency.trim().slice(0, 4) : DEFAULT_SAVINGS.currency
  return { perMeal, currency }
}

export function saveSavingsSettings(s: SavingsSettings) {
  saveJson(K_SAVE, s)
  window.dispatchEvent(new Event(EVT))
}

/**
 * Record a home-cooked dinner. De-duped: one entry per recipe per day,
 * max 3 per day (keeps savings estimates honest).
 * Returns true when a new dinner was counted.
 */
export function recordCooked(input: { recipeId?: string | null; title: string }): boolean {
  const log = loadCookedLog()
  const today = localDate()
  const todays = log.filter((e) => e.date === today)
  if (input.recipeId && todays.some((e) => e.recipeId === input.recipeId)) return false
  if (todays.length >= 3) return false
  log.push({ date: today, recipeId: input.recipeId ?? null, title: input.title.slice(0, 80), at: Date.now() })
  saveJson(K_LOG, log.slice(-500))
  window.dispatchEvent(new Event(EVT))
  return true
}

export function cookedToday(recipeId: string): boolean {
  const today = localDate()
  return loadCookedLog().some((e) => e.date === today && e.recipeId === recipeId)
}

export interface StreakStats {
  total: number
  thisWeek: number
  /** consecutive weeks (incl. this one, or last one if this week is empty) with ≥1 home-cooked dinner */
  weekStreak: number
  /** consecutive days ending today/yesterday */
  dayStreak: number
  saved: number
  settings: SavingsSettings
  last7: { date: string; count: number }[]
}

export function computeStats(log = loadCookedLog(), settings = loadSavingsSettings()): StreakStats {
  const now = new Date()
  const byDay = new Map<string, number>()
  const weeks = new Set<string>()
  for (const e of log) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + 1)
    weeks.add(weekStart(parseDate(e.date)))
  }
  const thisWeekKey = weekStart(now)
  const thisWeek = log.filter((e) => weekStart(parseDate(e.date)) === thisWeekKey).length

  let weekStreak = 0
  const w = parseDate(thisWeekKey)
  if (!weeks.has(thisWeekKey)) w.setDate(w.getDate() - 7)
  while (weeks.has(localDate(w))) {
    weekStreak++
    w.setDate(w.getDate() - 7)
  }

  let dayStreak = 0
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!byDay.has(localDate(d))) d.setDate(d.getDate() - 1)
  while (byDay.has(localDate(d))) {
    dayStreak++
    d.setDate(d.getDate() - 1)
  }

  const last7: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const k = localDate(x)
    last7.push({ date: k, count: byDay.get(k) ?? 0 })
  }

  return {
    total: log.length,
    thisWeek,
    weekStreak,
    dayStreak,
    saved: Math.round(log.length * settings.perMeal),
    settings,
    last7,
  }
}

export function formatMoney(amount: number, currency: string): string {
  const n = Math.round(amount).toLocaleString()
  // symbols go in front ($, €, £); codes/words go after (PKR, AED, ₺ reads fine either way)
  return /^[A-Za-z]{2,4}$/.test(currency) ? `${n} ${currency}` : `${currency}${n}`
}

export function useStreakStats(): StreakStats {
  const [stats, setStats] = useState<StreakStats>(() => computeStats())
  const refresh = useCallback(() => setStats(computeStats()), [])
  useEffect(() => {
    window.addEventListener(EVT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])
  return stats
}
