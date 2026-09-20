import type {
  CookStep,
  Difficulty,
  Ingredient,
  MealMatch,
  NutritionInfo,
  Recipe,
  WeekPlan,
  WeekPlanDay,
  FoodItem,
  MicroNutrient,
  DietPlan,
} from './types'
import { enrichAll } from '../lib/ingredientAmounts'
import { normalizeIngredientName } from '../lib/ingredientAmounts'

function asInt(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return Math.round(v)
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

function asNum(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseDifficulty(v: unknown): Difficulty {
  const s = String(v ?? 'easy').toLowerCase()
  if (s === 'medium' || s === 'hard') return s
  return 'easy'
}

function parseIngredient(e: unknown): Ingredient | null {
  if (typeof e === 'string') {
    const name = e.trim()
    return name ? { name } : null
  }
  if (e && typeof e === 'object') {
    const m = e as Record<string, unknown>
    const name = String(m.name ?? '').trim()
    if (!name) return null
    return {
      name,
      quantity: m.quantity != null || m.qty != null ? String(m.quantity ?? m.qty) : null,
      unit: m.unit != null ? String(m.unit) : null,
      useSoon: m.useSoon === true,
    }
  }
  return null
}

function parseSteps(raw: unknown): CookStep[] {
  const out: CookStep[] = []
  if (!Array.isArray(raw)) return out
  for (const e of raw) {
    if (typeof e === 'string') {
      const s = e.trim()
      if (s) out.push({ instruction: s })
    } else if (e && typeof e === 'object') {
      const m = e as Record<string, unknown>
      const instruction = String(m.instruction ?? m.text ?? '').trim()
      if (!instruction) continue
      out.push({ instruction, timerSeconds: asInt(m.timerSeconds ?? m.timer) })
    }
  }
  return out
}

function parseNutrition(raw: unknown): NutritionInfo | null {
  if (!raw || typeof raw !== 'object') return null
  const j = raw as Record<string, unknown>
  const d = (v: unknown) => asNum(v) ?? 0
  return {
    calories: d(j.calories ?? j.caloriesPerServing ?? j.kcal),
    protein: d(j.protein ?? j.proteinG ?? j.protein_g),
    carbs: d(j.carbs ?? j.carbohydrates ?? j.carbsG ?? j.carbs_g),
    fat: d(j.fat ?? j.fatG ?? j.fat_g),
    fiber: asNum(j.fiber ?? j.fiberG ?? j.fiber_g),
    sugar: asNum(j.sugar ?? j.sugarG ?? j.sugar_g),
    sodium: asNum(j.sodium ?? j.sodiumMg ?? j.sodium_mg),
    source: j.source != null ? String(j.source) : null,
    perServing: j.perServing !== false,
  }
}

function slugId(title: string, index: number): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'recipe'
  return `${base}-${index}`
}

export function recipeFromJson(json: Record<string, unknown>, index = 0): Recipe | null {
  const idRaw = typeof json.id === 'string' ? json.id.trim() : ''
  const title = String(json.title ?? '').trim()
  if (!title) return null

  const minutes =
    asInt(json.minutes) ??
    ((asInt(json.prepMinutes) ?? 0) + (asInt(json.cookMinutes) ?? 20))
  const total = Math.max(5, Math.min(90, minutes))
  const prep = asInt(json.prepMinutes) ?? Math.round(total * 0.3)
  const cook = asInt(json.cookMinutes) ?? Math.max(1, total - prep)

  const ingredients: Ingredient[] = []
  if (Array.isArray(json.ingredients)) {
    for (const e of json.ingredients) {
      const ing = parseIngredient(e)
      if (ing) ingredients.push(ing)
    }
  }
  if (!ingredients.length) return null

  const servings = asInt(json.servings) ?? 4
  const enriched = enrichAll(ingredients, servings <= 0 ? 4 : servings)

  let steps = parseSteps(json.steps)
  if (!steps.length) {
    steps = [{ instruction: 'Prep ingredients, cook until done, and serve.' }]
  }

  const tags: string[] = []
  const tagsRaw = json.tags ?? json.cuisine
  if (Array.isArray(tagsRaw)) {
    for (const t of tagsRaw) {
      const s = String(t).trim()
      if (s) tags.push(s)
    }
  }
  if (!tags.includes('catalog')) tags.push('catalog')

  const emojiRaw = String(json.emoji ?? '').trim()
  const emoji = emojiRaw && emojiRaw.length <= 8 ? emojiRaw : '🍽️'

  return {
    id: idRaw || slugId(title, index),
    title,
    description: String(json.description ?? 'Cookable tonight.').trim() || 'Cookable tonight.',
    ingredients: enriched,
    steps,
    prepMinutes: prep,
    cookMinutes: cook,
    servings: servings <= 0 ? 4 : servings,
    difficulty: parseDifficulty(json.difficulty),
    tags,
    emoji,
    nutrition: parseNutrition(json.nutrition),
  }
}

export function recipesFromSearchResponse(map: Record<string, unknown>): Recipe[] {
  const raw = map.recipes ?? map.meals ?? map.results
  if (!Array.isArray(raw)) return []
  const out: Recipe[] = []
  raw.forEach((e, i) => {
    if (!e || typeof e !== 'object') return
    const r = recipeFromJson(e as Record<string, unknown>, i)
    if (r) out.push(r)
  })
  return out
}

export function mealMatchFromRecipe(
  recipe: Recipe,
  available: Ingredient[],
  useSoonNames: string[] = [],
): MealMatch {
  const avail = new Set(available.map((a) => normalizeIngredientName(a.name)))
  const soon = new Set(useSoonNames.map(normalizeIngredientName))
  const have: Ingredient[] = []
  const missing: Ingredient[] = []
  let useSoonCount = 0
  for (const ing of recipe.ingredients) {
    const n = normalizeIngredientName(ing.name)
    if (avail.has(n) || [...avail].some((a) => a.includes(n) || n.includes(a))) {
      have.push(ing)
      if (soon.has(n) || [...soon].some((s) => s.includes(n) || n.includes(s))) useSoonCount++
    } else {
      missing.push(ing)
    }
  }
  const total = recipe.ingredients.length || 1
  const score = have.length / total + useSoonCount * 0.05
  return { recipe, have, missing, score, useSoonCount }
}

export function parseFoodItem(json: Record<string, unknown>): FoodItem | null {
  const id = String(json.id ?? '').trim()
  const name = String(json.name ?? '').trim()
  if (!id || !name) return null
  const d = (v: unknown, fb = 0) => asNum(v) ?? fb
  const opt = (v: unknown) => asNum(v)
  const micros = json.micros && typeof json.micros === 'object' ? (json.micros as Record<string, unknown>) : null
  const micro = (snake: string, camel?: string) =>
    opt(json[snake]) ?? (camel ? opt(json[camel]) : null) ?? (micros ? opt(micros[snake]) ?? (camel ? opt(micros[camel]) : null) : null)

  const rawUnit = String(json.unit ?? json.defaultUnit ?? '').trim().toLowerCase()
  const unit = rawUnit === 'ml' || json.isLiquid === true ? 'ml' : 'g'

  return {
    id,
    name,
    cal100: d(json.cal100),
    protein100: d(json.protein100),
    carbs100: d(json.carbs100),
    fat100: d(json.fat100),
    fiber100: opt(json.fiber100),
    sodium100: opt(json.sodium100),
    unit,
    vitaminCMg: micro('vitaminC_mg', 'vitaminCMg'),
    vitaminARae: micro('vitaminA_rae', 'vitaminARae'),
    vitaminDUg: micro('vitaminD_ug', 'vitaminDUg'),
    vitaminB12Ug: micro('vitaminB12_ug', 'vitaminB12Ug'),
    folateUg: micro('folate_ug', 'folateUg'),
    calciumMg: micro('calcium_mg', 'calciumMg'),
    ironMg: micro('iron_mg', 'ironMg'),
    magnesiumMg: micro('magnesium_mg', 'magnesiumMg'),
    potassiumMg: micro('potassium_mg', 'potassiumMg'),
    zincMg: micro('zinc_mg', 'zincMg'),
    aliases: Array.isArray(json.aliases) ? json.aliases.map(String) : [],
    tags: Array.isArray(json.tags) ? json.tags.map(String) : [],
    source: json.source != null ? String(json.source) : null,
  }
}

export function parseMicro(json: Record<string, unknown>): MicroNutrient {
  return {
    key: String(json.key ?? ''),
    label: String(json.label ?? json.key ?? ''),
    unit: String(json.unit ?? ''),
    amount: asNum(json.amount) ?? 0,
    per100g: asNum(json.per100g),
  }
}

export function parseWeekPlan(map: Record<string, unknown>): WeekPlan {
  const days: WeekPlanDay[] = []
  const daysRaw = map.days
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  if (Array.isArray(daysRaw)) {
    daysRaw.forEach((raw, i) => {
      if (!raw || typeof raw !== 'object') return
      const m = raw as Record<string, unknown>
      const dinnerRaw = m.dinner
      if (!dinnerRaw || typeof dinnerRaw !== 'object') return
      const dinner = recipeFromJson(dinnerRaw as Record<string, unknown>, i)
      if (!dinner) return
      const breakfast =
        m.breakfast && typeof m.breakfast === 'object'
          ? recipeFromJson(m.breakfast as Record<string, unknown>, i + 100)
          : null
      const lunch =
        m.lunch && typeof m.lunch === 'object'
          ? recipeFromJson(m.lunch as Record<string, unknown>, i + 200)
          : null
      const parseIngs = (r: unknown): Ingredient[] => {
        if (!Array.isArray(r)) return []
        return r.map(parseIngredient).filter(Boolean) as Ingredient[]
      }
      const dinnerMap = dinnerRaw as Record<string, unknown>
      days.push({
        dayIndex: asInt(m.dayIndex) ?? i,
        dayLabel:
          typeof m.dayLabel === 'string' && m.dayLabel.trim()
            ? m.dayLabel.trim()
            : labels[i % 7],
        dinner,
        breakfast,
        lunch,
        dinnerHave: parseIngs(m.dinnerHave ?? dinnerMap.have),
        dinnerMissing: parseIngs(m.dinnerMissing ?? dinnerMap.missing),
      })
    })
  }
  const missing: string[] = []
  if (Array.isArray(map.missingIngredients)) {
    for (const e of map.missingIngredients) {
      const s = String(e).trim()
      if (s) missing.push(s)
    }
  }
  if (!days.length) throw new Error('week-plan returned no days')
  return {
    days,
    missingIngredients: missing,
    source: typeof map.source === 'string' && map.source.trim() ? map.source.trim() : 'catalog',
    generatedAtMillis: asInt(map.generatedAtMillis),
    calorieTarget: asNum(map.calorieTarget),
    proteinG: asNum(map.proteinG),
    preferences: Array.isArray(map.preferences) ? map.preferences.map(String).filter(Boolean) : [],
  }
}

export function parseDietPlan(map: Record<string, unknown>): DietPlan {
  const meals: DietPlan['meals'] = []
  const raw = map.meals ?? map.dayMeals
  if (Array.isArray(raw)) {
    for (const e of raw) {
      if (!e || typeof e !== 'object') continue
      const j = e as Record<string, unknown>
      meals.push({
        slot: String(j.slot ?? j.meal ?? 'meal'),
        title: String(j.title ?? j.name ?? 'Meal'),
        calories: asNum(j.calories) ?? 0,
        protein: asNum(j.protein ?? j.proteinG) ?? 0,
        carbs: asNum(j.carbs ?? j.carbsG) ?? 0,
        fat: asNum(j.fat ?? j.fatG) ?? 0,
        fiber: asNum(j.fiber ?? j.fiberG),
        sodium: asNum(j.sodium ?? j.sodiumMg),
        recipeId: j.recipeId != null ? String(j.recipeId) : j.id != null ? String(j.id) : null,
        emoji: j.emoji != null ? String(j.emoji) : null,
        notes: j.notes != null ? String(j.notes) : null,
      })
    }
  }
  return {
    calorieTarget: asNum(map.calorieTarget ?? map.calories) ?? 0,
    proteinG: asNum(map.proteinG ?? map.protein) ?? 0,
    carbsG: asNum(map.carbsG ?? map.carbs) ?? 0,
    fatG: asNum(map.fatG ?? map.fat) ?? 0,
    meals,
    notes: map.notes != null ? String(map.notes) : null,
    source: map.source != null ? String(map.source) : null,
  }
}
