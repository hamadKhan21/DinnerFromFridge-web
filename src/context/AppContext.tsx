import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import {
  FREE_AI_LIMIT,
  type CalorieLogEntry,
  type DailyCalorieLog,
  type FavoriteRecipe,
  type FatLossGoal,
  type Ingredient,
  type MealMatch,
  type NutritionTargets,
  type Recipe,
  type ShoppingItem,
  type TonightFilters,
  type WeekPlan,
} from '../api/types'
import { getOrCreateDeviceId } from '../lib/deviceId'
import { loadJson, saveJson } from '../lib/storage'

const K = {
  ingredients: 'dff_ingredients',
  filters: 'dff_tonight_filters',
  favorites: 'dff_favorites',
  shopping: 'dff_shopping',
  weekPlan: 'dff_week_plan',
  goal: 'dff_fat_loss_goal',
  prefs: 'dff_dietary_prefs',
  quota: 'dff_quota_cache',
  calorieLog: 'dff_calorie_log',
  nutritionTargets: 'dff_nutrition_targets',
}

export function localDateString(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyLog(date = localDateString()): DailyCalorieLog {
  return { date, entries: [] }
}

function loadTodayLog(): DailyCalorieLog {
  const stored = loadJson<DailyCalorieLog | null>(K.calorieLog, null)
  const today = localDateString()
  if (!stored || stored.date !== today) return emptyLog(today)
  return { date: today, entries: Array.isArray(stored.entries) ? stored.entries : [] }
}

function newEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface AppState {
  deviceId: string
  ingredients: Ingredient[]
  tonightFilters: TonightFilters
  favorites: FavoriteRecipe[]
  shopping: ShoppingItem[]
  weekPlan: WeekPlan | null
  goal: FatLossGoal | null
  dietaryPreferences: string[]
  quotaRemaining: number
  quotaLimit: number
  quotaUsed: number
  suggestions: MealMatch[]
  suggestionsNote: string | null
  suggestionsLoading: boolean
  setIngredients: (ings: Ingredient[]) => void
  updateIngredient: (index: number, patch: Partial<Ingredient>) => void
  addIngredient: (name: string) => void
  removeIngredient: (index: number) => void
  setTonightFilters: (f: TonightFilters) => void
  refreshQuota: () => Promise<void>
  setQuota: (remaining: number, used: number, limit: number) => void
  computeSuggestions: (filtersOverride?: TonightFilters) => Promise<MealMatch[]>
  toggleFavorite: (recipe: Recipe) => void
  isFavorite: (id: string) => boolean
  addShopping: (name: string, quantity?: string | null, unit?: string | null) => void
  addMissingToShopping: (missing: Ingredient[]) => void
  toggleShopping: (id: string) => void
  removeShopping: (id: string) => void
  clearShoppingChecked: () => void
  setWeekPlan: (plan: WeekPlan | null) => void
  setGoal: (goal: FatLossGoal | null) => void
  setDietaryPreferences: (prefs: string[]) => void
  rememberRecipe: (recipe: Recipe) => void
  getCachedRecipe: (id: string) => Recipe | undefined
  nutritionTargets: NutritionTargets | null
  setNutritionTargets: (targets: NutritionTargets | null) => void
  todayLog: DailyCalorieLog
  addCalorieEntry: (
    entry: Omit<CalorieLogEntry, 'id' | 'createdAtMillis'> & { createdAtMillis?: number },
  ) => CalorieLogEntry
  removeCalorieEntry: (id: string) => void
  clearTodayLog: () => void
  todayTotals: { calories: number; protein: number; carbs: number; fat: number }
  caloriesRemaining: number | null
}

const AppContext = createContext<AppState | null>(null)

function isStrong(m: MealMatch): boolean {
  const total = m.have.length + m.missing.length || 1
  return m.missing.length <= 2 && m.have.length / total >= 0.45
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [deviceId] = useState(() => getOrCreateDeviceId())
  const [ingredients, setIngredientsState] = useState<Ingredient[]>(() => loadJson(K.ingredients, []))
  const [tonightFilters, setFiltersState] = useState<TonightFilters>(() => loadJson(K.filters, {}))
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>(() => loadJson(K.favorites, []))
  const [shopping, setShopping] = useState<ShoppingItem[]>(() => loadJson(K.shopping, []))
  const [weekPlan, setWeekPlanState] = useState<WeekPlan | null>(() => loadJson(K.weekPlan, null))
  const [goal, setGoalState] = useState<FatLossGoal | null>(() => loadJson(K.goal, null))
  const [dietaryPreferences, setPrefsState] = useState<string[]>(() => loadJson(K.prefs, []))
  const [quotaRemaining, setRemaining] = useState(() => loadJson(K.quota, { remaining: FREE_AI_LIMIT }).remaining ?? FREE_AI_LIMIT)
  const [quotaUsed, setUsed] = useState(() => loadJson(K.quota, { used: 0 }).used ?? 0)
  const [quotaLimit, setLimit] = useState(() => loadJson(K.quota, { limit: FREE_AI_LIMIT }).limit ?? FREE_AI_LIMIT)
  const [suggestions, setSuggestions] = useState<MealMatch[]>([])
  const [suggestionsNote, setNote] = useState<string | null>(null)
  const [suggestionsLoading, setLoading] = useState(false)
  const [recipeCache, setRecipeCache] = useState<Record<string, Recipe>>({})
  const [nutritionTargets, setTargetsState] = useState<NutritionTargets | null>(() =>
    loadJson(K.nutritionTargets, null),
  )
  const [todayLog, setTodayLog] = useState<DailyCalorieLog>(() => loadTodayLog())

  useEffect(() => {
    saveJson(K.ingredients, ingredients)
  }, [ingredients])
  useEffect(() => {
    saveJson(K.filters, tonightFilters)
  }, [tonightFilters])
  useEffect(() => {
    saveJson(K.favorites, favorites)
  }, [favorites])
  useEffect(() => {
    saveJson(K.shopping, shopping)
  }, [shopping])
  useEffect(() => {
    saveJson(K.weekPlan, weekPlan)
  }, [weekPlan])
  useEffect(() => {
    saveJson(K.goal, goal)
  }, [goal])
  useEffect(() => {
    saveJson(K.prefs, dietaryPreferences)
  }, [dietaryPreferences])
  useEffect(() => {
    saveJson(K.quota, { remaining: quotaRemaining, used: quotaUsed, limit: quotaLimit })
  }, [quotaRemaining, quotaUsed, quotaLimit])
  useEffect(() => {
    saveJson(K.nutritionTargets, nutritionTargets)
  }, [nutritionTargets])
  useEffect(() => {
    saveJson(K.calorieLog, todayLog)
  }, [todayLog])

  // Roll to a fresh day if the calendar date changed while the app stayed open
  useEffect(() => {
    const tick = () => {
      const today = localDateString()
      setTodayLog((prev) => (prev.date === today ? prev : emptyLog(today)))
    }
    const id = window.setInterval(tick, 60_000)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [])

  const refreshQuota = useCallback(async () => {
    try {
      const q = await api.fetchQuota(deviceId)
      setRemaining(q.remaining)
      setUsed(q.used)
      setLimit(q.limit)
    } catch {
      /* keep cache */
    }
  }, [deviceId])

  useEffect(() => {
    void refreshQuota()
  }, [refreshQuota])

  const setIngredients = (ings: Ingredient[]) => setIngredientsState(ings)

  const updateIngredient = (index: number, patch: Partial<Ingredient>) => {
    setIngredientsState((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)))
  }

  const addIngredient = (name: string) => {
    const n = name.trim()
    if (!n) return
    setIngredientsState((prev) => [...prev, { name: n }])
  }

  const removeIngredient = (index: number) => {
    setIngredientsState((prev) => prev.filter((_, i) => i !== index))
  }

  const setTonightFilters = (f: TonightFilters) => setFiltersState(f)

  const setQuota = (remaining: number, used: number, limit: number) => {
    setRemaining(remaining)
    setUsed(used)
    setLimit(limit)
  }

  const rememberRecipe = (recipe: Recipe) => {
    setRecipeCache((prev) => ({ ...prev, [recipe.id]: recipe }))
  }

  const getCachedRecipe = (id: string) => recipeCache[id] ?? favorites.find((f) => f.recipe.id === id)?.recipe

  const computeSuggestions = useCallback(async (filtersOverride?: TonightFilters) => {
    if (!ingredients.length) {
      setSuggestions([])
      setNote(null)
      return []
    }
    const filters = filtersOverride ?? tonightFilters
    setLoading(true)
    setNote(null)
    try {
      const limit = 3
      const fetchLimit =
        filters.maxMinutes != null || filters.onePan || filters.airFryer || filters.noOven
          ? limit * 4
          : limit
      const soon = ingredients.filter((e) => e.useSoon).map((e) => e.name.trim()).filter(Boolean)

      const cacheRecipes = (pick: MealMatch[]) => {
        setRecipeCache((prev) => {
          const next = { ...prev }
          for (const m of pick) next[m.recipe.id] = m.recipe
          return next
        })
      }

      let catalog: MealMatch[] = []
      try {
        catalog = await api.matchDinners({
          available: ingredients,
          limit: fetchLimit,
          preferences: dietaryPreferences,
          useSoonIngredients: soon,
          filters,
        })
      } catch {
        /* fall through */
      }

      const strong = catalog.filter(isStrong).slice(0, limit)
      if (strong.length >= limit || (strong.length > 0 && catalog.length > 0)) {
        const pick = (strong.length >= limit ? strong : catalog).slice(0, limit)
        cacheRecipes(pick)
        setSuggestions(pick)
        setNote(catalog.length ? 'cloudRecipes' : 'localRecipes')
        return pick
      }

      try {
        const ai = await api.dinners({
          deviceId,
          available: ingredients,
          limit: fetchLimit,
          preferences: dietaryPreferences,
          useSoonIngredients: soon,
          filters,
        })
        if (ai.length) {
          const pick = ai.slice(0, limit)
          cacheRecipes(pick)
          setSuggestions(pick)
          setNote('aiDinners')
          return pick
        }
      } catch {
        /* use catalog if any */
      }

      const fallback = catalog.slice(0, limit)
      cacheRecipes(fallback)
      setSuggestions(fallback)
      setNote(fallback.length ? 'cloudRecipes' : null)
      return fallback
    } finally {
      setLoading(false)
    }
  }, [ingredients, tonightFilters, dietaryPreferences, deviceId])

  const toggleFavorite = (recipe: Recipe) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.recipe.id === recipe.id)
      if (exists) return prev.filter((f) => f.recipe.id !== recipe.id)
      return [{ recipe, savedAtMillis: Date.now() }, ...prev]
    })
    rememberRecipe(recipe)
  }

  const isFavorite = (id: string) => favorites.some((f) => f.recipe.id === id)

  const addShopping = (name: string, quantity?: string | null, unit?: string | null) => {
    const n = name.trim()
    if (!n) return
    setShopping((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: n, checked: false, quantity, unit },
    ])
  }

  const addMissingToShopping = (missing: Ingredient[]) => {
    setShopping((prev) => {
      const names = new Set(prev.map((p) => p.name.toLowerCase()))
      const next = [...prev]
      for (const m of missing) {
        if (names.has(m.name.toLowerCase())) continue
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: m.name,
          checked: false,
          quantity: m.quantity,
          unit: m.unit,
        })
      }
      return next
    })
  }

  const toggleShopping = (id: string) => {
    setShopping((prev) => prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)))
  }

  const removeShopping = (id: string) => setShopping((prev) => prev.filter((s) => s.id !== id))
  const clearShoppingChecked = () => setShopping((prev) => prev.filter((s) => !s.checked))

  const setNutritionTargets = (targets: NutritionTargets | null) => setTargetsState(targets)

  const addCalorieEntry = useCallback(
    (entry: Omit<CalorieLogEntry, 'id' | 'createdAtMillis'> & { createdAtMillis?: number }) => {
      const full: CalorieLogEntry = {
        ...entry,
        id: newEntryId(),
        createdAtMillis: entry.createdAtMillis ?? Date.now(),
      }
      setTodayLog((prev) => {
        const today = localDateString()
        const base = prev.date === today ? prev : emptyLog(today)
        return { date: today, entries: [...base.entries, full] }
      })
      return full
    },
    [],
  )

  const removeCalorieEntry = useCallback((id: string) => {
    setTodayLog((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }))
  }, [])

  const clearTodayLog = useCallback(() => {
    setTodayLog(emptyLog())
  }, [])

  const todayTotals = useMemo(() => {
    return todayLog.entries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fat: acc.fat + (e.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [todayLog])

  const caloriesRemaining = useMemo(() => {
    if (!nutritionTargets) return null
    return Math.round(nutritionTargets.calorieTarget - todayTotals.calories)
  }, [nutritionTargets, todayTotals])

  const value = useMemo<AppState>(
    () => ({
      deviceId,
      ingredients,
      tonightFilters,
      favorites,
      shopping,
      weekPlan,
      goal,
      dietaryPreferences,
      quotaRemaining,
      quotaLimit,
      quotaUsed,
      suggestions,
      suggestionsNote,
      suggestionsLoading,
      setIngredients,
      updateIngredient,
      addIngredient,
      removeIngredient,
      setTonightFilters,
      refreshQuota,
      setQuota,
      computeSuggestions,
      toggleFavorite,
      isFavorite,
      addShopping,
      addMissingToShopping,
      toggleShopping,
      removeShopping,
      clearShoppingChecked,
      setWeekPlan: setWeekPlanState,
      setGoal: setGoalState,
      setDietaryPreferences: setPrefsState,
      rememberRecipe,
      getCachedRecipe,
      nutritionTargets,
      setNutritionTargets,
      todayLog,
      addCalorieEntry,
      removeCalorieEntry,
      clearTodayLog,
      todayTotals,
      caloriesRemaining,
    }),
    [
      deviceId,
      ingredients,
      tonightFilters,
      favorites,
      shopping,
      weekPlan,
      goal,
      dietaryPreferences,
      quotaRemaining,
      quotaLimit,
      quotaUsed,
      suggestions,
      suggestionsNote,
      suggestionsLoading,
      refreshQuota,
      computeSuggestions,
      recipeCache,
      nutritionTargets,
      todayLog,
      addCalorieEntry,
      removeCalorieEntry,
      clearTodayLog,
      todayTotals,
      caloriesRemaining,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
