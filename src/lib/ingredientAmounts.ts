import type { Ingredient } from '../api/types'
import { formatQuantity, parseQuantity } from './servingScale'

const BASE = 4

const EXACT: Record<string, [string, string | null]> = {
  salt: ['1.5', 'tsp'],
  'black pepper': ['1/2', 'tsp'],
  pepper: ['1/2', 'tsp'],
  oil: ['2', 'tbsp'],
  'olive oil': ['2', 'tbsp'],
  'sesame oil': ['1', 'tbsp'],
  ghee: ['2', 'tbsp'],
  butter: ['2', 'tbsp'],
  garlic: ['4', 'cloves'],
  ginger: ['1', 'tbsp'],
  onion: ['1', 'large'],
  yogurt: ['1', 'cup'],
  'basmati rice': ['1.5', 'cups'],
  rice: ['1.5', 'cups'],
  chicken: ['1.5', 'lb'],
  eggs: ['4', null],
  egg: ['2', null],
  pasta: ['12', 'oz'],
  flour: ['1', 'cup'],
  milk: ['1', 'cup'],
  cream: ['1/2', 'cup'],
  broth: ['2', 'cups'],
  stock: ['2', 'cups'],
  soy: ['3', 'tbsp'],
  'soy sauce': ['3', 'tbsp'],
  tomato: ['2', null],
  lemon: ['1', null],
  lime: ['1', null],
}

const PATTERNS: [RegExp, [string, string | null]][] = [
  [/\b(chicken|beef|pork|lamb|mutton|turkey|goat)\b/, ['1.25', 'lb']],
  [/\b(shrimp|prawn|fish|salmon)\b/, ['1', 'lb']],
  [/\brice\b/, ['1.5', 'cups']],
  [/\b(oil|ghee)\b/, ['2', 'tbsp']],
  [/\b(sauce|paste)\b/, ['2', 'tbsp']],
  [/\b(powder|masala|spice)\b/, ['1', 'tsp']],
  [/\b(cilantro|parsley|mint|basil)\b/, ['1/4', 'cup']],
  [/\b(milk|cream|yogurt|curd)\b/, ['1', 'cup']],
  [/\b(cheese|paneer|tofu)\b/, ['8', 'oz']],
  [/\b(noodle|pasta)\b/, ['12', 'oz']],
  [/\b(broth|stock)\b/, ['2', 'cups']],
  [/\b(onion|shallot)\b/, ['1', 'large']],
  [/\b(potato|tomato|carrot)\b/, ['2', null]],
  [/\b(garlic)\b/, ['3', 'cloves']],
  [/\b(ginger)\b/, ['1', 'tbsp']],
  [/\b(lemon|lime)\b/, ['1', null]],
  [/\b(egg)\b/, ['4', null]],
]

function guess(name: string, servings: number): [string, string | null] | null {
  const key = name.trim().toLowerCase()
  if (!key) return null
  let pair = EXACT[key]
  if (!pair) {
    for (const [re, p] of PATTERNS) {
      if (re.test(key)) {
        pair = p
        break
      }
    }
  }
  pair ??= ['1', null]
  if (servings === BASE) return pair
  const parsed = parseQuantity(pair[0])
  if (parsed == null) return pair
  return [formatQuantity((parsed * servings) / BASE), pair[1]]
}

export function enrichIngredient(ing: Ingredient, servings = BASE): Ingredient {
  const q = ing.quantity?.trim()
  if (q) return ing
  const g = guess(ing.name, servings)
  if (!g) return ing
  return { ...ing, quantity: g[0], unit: g[1] ?? ing.unit }
}

export function enrichAll(ingredients: Ingredient[], servings = BASE): Ingredient[] {
  return ingredients.map((i) => enrichIngredient(i, servings <= 0 ? BASE : servings))
}

export function normalizeIngredientName(raw: string): string {
  let s = raw.trim().toLowerCase()
  s = s.replace(/[-_]+/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  if (s.endsWith('oes') && s.length > 4) s = s.slice(0, -2)
  else if (s.endsWith('ies') && s.length > 4) s = `${s.slice(0, -3)}y`
  else if (s.endsWith('ses') && s.length > 4) s = s.slice(0, -2)
  else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) s = s.slice(0, -1)
  return s
}
