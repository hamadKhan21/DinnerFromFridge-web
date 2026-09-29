import {
  ApiError,
  FREE_AI_LIMIT,
  PaywallError,
  type CloudQuota,
  type CloudScanResult,
  type DietPlan,
  type FoodItem,
  type FoodNutritionResult,
  type Ingredient,
  type MealMatch,
  type NutritionInfo,
  type Recipe,
  type TonightFilters,
  type WeekPlan,
} from './types'
import {
  mealMatchFromRecipe,
  parseDietPlan,
  parseFoodItem,
  parseMicro,
  parseWeekPlan,
  recipeFromJson,
  recipesFromSearchResponse,
} from './mapper'
import { kindFromResponse } from '../lib/friendlyError'


const DEFAULT_BASE = 'https://tonightfromthis.hamad2k9.workers.dev'

function apiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_BASE
  return raw.replace(/\/+$/, '')
}

async function decodeMap(res: Response): Promise<Record<string, unknown>> {
  try {
    const data = await res.json()
    if (data && typeof data === 'object') return data as Record<string, unknown>
  } catch {
    /* ignore */
  }
  return {}
}

function filtersWire(filters?: TonightFilters): Record<string, unknown> | undefined {
  if (!filters) return undefined
  const m: Record<string, unknown> = {}
  if (filters.maxMinutes != null) m.maxMinutes = filters.maxMinutes
  if (filters.onePan) m.onePan = true
  if (filters.airFryer) m.airFryer = true
  if (filters.noOven) m.noOven = true
  return Object.keys(m).length ? m : undefined
}

function throwIfPaywall(res: Response, map: Record<string, unknown>): void {
  // Only 402 or explicit PAYWALL — bare 403 is often Cloudflare bot challenge (1010), not paywall.
  if (res.status === 402 || map.code === 'PAYWALL') {
    throw new PaywallError(
      String(map.message ?? 'Free AI limit reached (scans + Ask AI share 3 uses)'),
      Number(map.remaining ?? 0),
    )
  }
}

/** Build a user-safe error from a failed response. Raw server text is never kept. */
function toApiError(res: Response, map: Record<string, unknown>): ApiError {
  return new ApiError(kindFromResponse(res.status, map), res.status)
}

export const api = {
  baseUrl: apiBase,

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${apiBase()}/health`)
      return res.ok
    } catch {
      return false
    }
  },

  async fetchQuota(deviceId: string): Promise<CloudQuota> {
    const url = new URL(`${apiBase()}/v1/quota`)
    url.searchParams.set('deviceId', deviceId)
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    return {
      remaining: Number(map.remaining ?? 0),
      used: Number(map.used ?? 0),
      limit: Number(map.limit ?? FREE_AI_LIMIT),
      isPro: map.isPro === true,
    }
  },

  async scan(
    deviceId: string,
    imageBase64: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  ): Promise<CloudScanResult> {
    const body: Record<string, unknown> = { deviceId, imageBase64, mimeType }
    const res = await fetch(`${apiBase()}/v1/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    throwIfPaywall(res, map)
    if (!res.ok) throw toApiError(res, map)

    const names: string[] = []
    const raw = map.ingredients
    if (Array.isArray(raw)) {
      for (const e of raw) {
        if (typeof e === 'string' && e.trim()) names.push(e.trim())
        else if (e && typeof e === 'object' && (e as { name?: string }).name) {
          const n = String((e as { name: string }).name).trim()
          if (n) names.push(n)
        }
      }
    }
    return {
      ingredients: names.map((name) => ({ name })),
      remaining: Number(map.remaining ?? 0),
      used: Number(map.used ?? 0),
      limit: Number(map.limit ?? FREE_AI_LIMIT),
      note: String(map.note ?? 'Photo scan — confirm ingredients below.'),
      isPro: map.isPro === true,
    }
  },

  async matchDinners(opts: {
    available: Ingredient[]
    limit?: number
    preferences?: string[]
    useSoonIngredients?: string[]
    filters?: TonightFilters
  }): Promise<MealMatch[]> {
    const names = opts.available.map((e) => e.name.trim()).filter(Boolean)
    if (!names.length) return []
    const soon =
      opts.useSoonIngredients?.length
        ? opts.useSoonIngredients
        : opts.available.filter((e) => e.useSoon).map((e) => e.name.trim()).filter(Boolean)
    const body: Record<string, unknown> = {
      ingredients: names,
      limit: opts.limit ?? 3,
    }
    if (opts.preferences?.length) body.preferences = opts.preferences
    if (soon.length) body.useSoonIngredients = soon
    const fw = filtersWire(opts.filters)
    if (fw) body.filters = fw

    const res = await fetch(`${apiBase()}/v1/dinners/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    const mealsRaw = map.meals
    if (!Array.isArray(mealsRaw) || !mealsRaw.length) return []
    const recipes: Recipe[] = []
    mealsRaw.forEach((raw, i) => {
      if (!raw || typeof raw !== 'object') return
      const r = recipeFromJson(raw as Record<string, unknown>, i)
      if (r) recipes.push(r)
    })
    return recipes.map((r) => mealMatchFromRecipe(r, opts.available, soon))
  },

  async dinners(opts: {
    deviceId: string
    available: Ingredient[]
    limit?: number
    preferences?: string[]
    useSoonIngredients?: string[]
    filters?: TonightFilters
  }): Promise<MealMatch[]> {
    const names = opts.available.map((e) => e.name.trim()).filter(Boolean)
    if (!names.length) return []
    const soon =
      opts.useSoonIngredients?.length
        ? opts.useSoonIngredients
        : opts.available.filter((e) => e.useSoon).map((e) => e.name.trim()).filter(Boolean)
    const body: Record<string, unknown> = {
      deviceId: opts.deviceId,
      ingredients: names,
      limit: opts.limit ?? 3,
    }
    if (opts.preferences?.length) body.preferences = opts.preferences
    if (soon.length) body.useSoonIngredients = soon
    const fw = filtersWire(opts.filters)
    if (fw) body.filters = fw

    const res = await fetch(`${apiBase()}/v1/dinners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    const mealsRaw = map.meals
    if (!Array.isArray(mealsRaw) || !mealsRaw.length) throw new ApiError('busy')
    const recipes: Recipe[] = []
    mealsRaw.forEach((raw, i) => {
      if (!raw || typeof raw !== 'object') return
      const r = recipeFromJson(raw as Record<string, unknown>, i)
      if (r) recipes.push(r)
    })
    if (!recipes.length) throw new ApiError('busy')
    return recipes.map((r) => mealMatchFromRecipe(r, opts.available, soon))
  },

  async searchRecipes(query = '', limit = 20, preferences: string[] = []): Promise<Recipe[]> {
    const url = new URL(`${apiBase()}/v1/recipes/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))
    if (preferences.length) url.searchParams.set('preferences', preferences.join(','))
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    return recipesFromSearchResponse(map)
  },

  async getRecipe(id: string): Promise<Recipe | null> {
    const res = await fetch(`${apiBase()}/v1/recipes/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
    })
    const map = await decodeMap(res)
    if (res.status === 404) return null
    if (!res.ok) throw toApiError(res, map)
    const raw = map.recipe
    if (!raw || typeof raw !== 'object') return null
    return recipeFromJson(raw as Record<string, unknown>)
  },

  async lookupRecipe(query: string, deviceId?: string): Promise<Recipe[]> {
    const body: Record<string, unknown> = { query }
    if (deviceId) body.deviceId = deviceId
    const res = await fetch(`${apiBase()}/v1/recipes/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    throwIfPaywall(res, map)
    if (!res.ok) throw toApiError(res, map)
    // Older backends reported AI failures with a 200 + error code.
    if (map.code === 'GEMINI_ERROR' || (typeof map.error === 'string' && map.error)) {
      throw new ApiError(kindFromResponse(503, map), res.status)
    }
    return recipesFromSearchResponse(map)
  },

  async searchFoods(query = '', limit = 20): Promise<FoodItem[]> {
    const url = new URL(`${apiBase()}/v1/foods/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    const raw = map.foods
    if (!Array.isArray(raw)) return []
    return raw
      .map((e) => (e && typeof e === 'object' ? parseFoodItem(e as Record<string, unknown>) : null))
      .filter(Boolean) as FoodItem[]
  },

  async getFood(id: string, deviceId?: string): Promise<FoodItem | null> {
    const url = new URL(`${apiBase()}/v1/foods/${encodeURIComponent(id)}`)
    if (deviceId) url.searchParams.set('deviceId', deviceId)
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const map = await decodeMap(res)
    if (res.status === 404) return null
    if (!res.ok) throw toApiError(res, map)
    const raw = map.food
    if (!raw || typeof raw !== 'object') return null
    return parseFoodItem(raw as Record<string, unknown>)
  },

  async lookupFood(query: string, deviceId?: string): Promise<FoodItem | null> {
    const body: Record<string, unknown> = { query }
    if (deviceId) body.deviceId = deviceId
    const res = await fetch(`${apiBase()}/v1/foods/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (res.status === 429 || res.status >= 500) throw toApiError(res, map)
    if (!res.ok) return null
    const raw = map.food
    if (!raw || typeof raw !== 'object') return null
    return parseFoodItem(raw as Record<string, unknown>)
  },

  async scaleFood(opts: { foodId?: string; query?: string; grams?: number }): Promise<NutritionInfo | null> {
    const body: Record<string, unknown> = { grams: opts.grams ?? 100 }
    if (opts.foodId) body.foodId = opts.foodId
    if (opts.query) body.query = opts.query
    const res = await fetch(`${apiBase()}/v1/foods/scale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (res.status === 404) return null
    if (!res.ok) throw toApiError(res, map)
    const raw = map.macros
    if (!raw || typeof raw !== 'object') return null
    const j = raw as Record<string, unknown>
    const d = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    return {
      calories: d(j.calories ?? j.kcal),
      protein: d(j.protein ?? j.proteinG),
      carbs: d(j.carbs ?? j.carbsG),
      fat: d(j.fat ?? j.fatG),
      fiber: j.fiber != null ? d(j.fiber) : null,
      sodium: j.sodium != null ? d(j.sodium) : null,
      perServing: false,
      source: 'scaled',
    }
  },

  async getFoodNutrition(id: string, grams = 100, deviceId?: string): Promise<FoodNutritionResult | null> {
    const url = new URL(`${apiBase()}/v1/foods/${encodeURIComponent(id)}/nutrition`)
    url.searchParams.set('grams', String(Math.max(1, Math.min(5000, grams))))
    if (deviceId) url.searchParams.set('deviceId', deviceId)
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const map = await decodeMap(res)
    if (res.status === 404) return null
    if (!res.ok) throw toApiError(res, map)
    const foodRaw = map.food
    if (!foodRaw || typeof foodRaw !== 'object') return null
    const food = parseFoodItem(foodRaw as Record<string, unknown>)
    if (!food) return null
    const micros = Array.isArray(map.micronutrients)
      ? map.micronutrients
          .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
          .map(parseMicro)
      : []
    return {
      food,
      grams: typeof map.grams === 'number' ? map.grams : grams,
      micronutrients: micros,
    }
  },

  async weekPlan(opts: {
    ingredients?: string[]
    calorieTarget?: number
    proteinG?: number
    preferences?: string[]
    includeSides?: boolean
    refresh?: boolean
    deviceId?: string
  }): Promise<WeekPlan> {
    const body: Record<string, unknown> = {
      includeSides: opts.includeSides ?? true,
      refresh: opts.refresh ?? false,
    }
    if (opts.ingredients?.length) body.ingredients = opts.ingredients
    if (opts.calorieTarget != null) body.calorieTarget = opts.calorieTarget
    if (opts.proteinG != null) body.proteinG = opts.proteinG
    if (opts.preferences?.length) body.preferences = opts.preferences
    if (opts.deviceId) body.deviceId = opts.deviceId
    const res = await fetch(`${apiBase()}/v1/meals/week-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    return parseWeekPlan(map)
  },

  async nutritionPlan(opts: {
    weightKg: number
    goalWeightKg: number
    heightCm?: number
    age?: number
    sex?: string
    activity?: string
    refresh?: boolean
    deviceId?: string
  }): Promise<DietPlan> {
    const body: Record<string, unknown> = {
      weightKg: opts.weightKg,
      goalWeightKg: opts.goalWeightKg,
      activity: opts.activity ?? 'moderate',
      refresh: opts.refresh ?? false,
    }
    if (opts.heightCm != null) body.heightCm = opts.heightCm
    if (opts.age != null) body.age = opts.age
    if (opts.sex) body.sex = opts.sex
    if (opts.deviceId) body.deviceId = opts.deviceId
    const res = await fetch(`${apiBase()}/v1/nutrition/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const map = await decodeMap(res)
    if (!res.ok) throw toApiError(res, map)
    return parseDietPlan(map)
  },
}
