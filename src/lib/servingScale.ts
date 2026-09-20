import type { Ingredient, NutritionInfo, Recipe } from '../api/types'

const VULGAR: Record<string, string> = {
  '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
}

export function parseQuantity(raw: string): number | null {
  let s = raw.trim().toLowerCase()
  if (!s) return null
  for (const [k, v] of Object.entries(VULGAR)) s = s.replaceAll(k, ` ${v}`)
  s = s.replace(/\s+/g, ' ').trim()

  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s)
  if (mixed) {
    const whole = Number(mixed[1]), num = Number(mixed[2]), den = Number(mixed[3])
    if (!den) return null
    return whole + num / den
  }
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(s)
  if (frac) {
    const num = Number(frac[1]), den = Number(frac[2])
    if (!den) return null
    return num / den
  }
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function formatQuantity(value: number): string {
  if (value <= 0) return '0'
  const rounded = Math.round(value * 1000) / 1000
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded))

  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.375, '⅜'],
    [0.5, '½'], [0.625, '⅝'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
  ]
  const whole = Math.floor(rounded)
  const frac = rounded - whole
  for (const [k, label] of fractions) {
    if (Math.abs(frac - k) < 0.02) return whole === 0 ? label : `${whole}${label}`
  }
  if (Math.abs(1 - frac) < 0.02) return String(whole + 1)
  if (rounded >= 10) return rounded.toFixed(0)
  if (rounded >= 1) {
    const t = rounded.toFixed(1)
    return t.endsWith('.0') ? t.slice(0, -2) : t
  }
  const t = rounded.toFixed(2)
  return t.endsWith('0') ? t.slice(0, -1) : t
}

export function prettyQuantity(quantity?: string | null): string {
  if (!quantity) return ''
  const raw = quantity.trim()
  if (!raw) return raw
  const parsed = parseQuantity(raw)
  return parsed == null ? raw : formatQuantity(parsed)
}

export function scaleQuantity(quantity: string | null | undefined, scale: number): string | null | undefined {
  if (quantity == null) return quantity
  const raw = quantity.trim()
  if (!raw) return quantity
  if (Math.abs(scale - 1) < 1e-9) return quantity
  const parsed = parseQuantity(raw)
  if (parsed == null) return quantity
  return formatQuantity(parsed * scale)
}

export function scaleIngredient(ing: Ingredient, scale: number): Ingredient {
  if (Math.abs(scale - 1) < 1e-9) return ing
  return { ...ing, quantity: scaleQuantity(ing.quantity, scale) }
}

export function scaleIngredients(list: Ingredient[], scale: number): Ingredient[] {
  return list.map((i) => scaleIngredient(i, scale))
}

function multiplyNutrition(n: NutritionInfo, factor: number): NutritionInfo {
  const m = (v?: number | null) => (v == null ? null : Math.round(v * factor * 10) / 10)
  return {
    ...n,
    calories: Math.round(n.calories * factor * 10) / 10,
    protein: Math.round(n.protein * factor * 10) / 10,
    carbs: Math.round(n.carbs * factor * 10) / 10,
    fat: Math.round(n.fat * factor * 10) / 10,
    fiber: m(n.fiber),
    sugar: m(n.sugar),
    sodium: m(n.sodium),
  }
}

export function scaleNutrition(
  nutrition: NutritionInfo | null | undefined,
  selectedServings: number,
  baseServings: number,
): NutritionInfo | null | undefined {
  if (!nutrition) return nutrition
  const selected = Math.max(1, Math.min(8, selectedServings))
  const base = baseServings <= 0 ? 1 : baseServings
  const scaled =
    nutrition.perServing !== false
      ? multiplyNutrition(nutrition, selected)
      : multiplyNutrition(nutrition, selected / base)
  return { ...scaled, perServing: false }
}

export function scaleRecipe(recipe: Recipe, selectedServings: number): Recipe {
  const base = recipe.servings <= 0 ? 1 : recipe.servings
  const selected = Math.max(1, Math.min(8, selectedServings))
  const scale = selected / base
  if (Math.abs(scale - 1) < 1e-9 && selected === recipe.servings) return recipe
  return {
    ...recipe,
    servings: selected,
    ingredients: scaleIngredients(recipe.ingredients, scale),
    nutrition: scaleNutrition(recipe.nutrition, selected, base) ?? recipe.nutrition,
  }
}

export function ingredientDisplayLabel(ing: Ingredient): string {
  const qty = prettyQuantity(ing.quantity)
  const u = (ing.unit ?? '').trim()
  const amount = [qty, u].filter(Boolean).join(' ')
  return amount ? `${amount} · ${ing.name}` : ing.name
}

export function totalMinutes(recipe: Recipe): number {
  return recipe.prepMinutes + recipe.cookMinutes
}

export function difficultyLabel(d: string): string {
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : 'Easy'
}
