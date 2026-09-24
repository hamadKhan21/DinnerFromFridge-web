import type { Recipe } from '../api/types'
import { totalMinutes } from './servingScale'

/** Compact meal entry for share URLs (keep payload small). */
export interface ShareMeal {
  id: string
  t: string
  e?: string
  m?: number
  cal?: number
  p?: number
  c?: number
  f?: number
  ings?: string[]
}

export interface SharePayload {
  v: 1
  meals: ShareMeal[]
  note?: string
}

const MAX_INGS = 8
const MAX_ING_LEN = 28
const MAX_TITLE = 80
const MAX_NOTE = 120

export function mealFromRecipe(recipe: Recipe): ShareMeal {
  const ings = recipe.ingredients
    .slice(0, MAX_INGS)
    .map((i) => i.name.trim().slice(0, MAX_ING_LEN))
    .filter(Boolean)
  const meal: ShareMeal = {
    id: recipe.id,
    t: recipe.title.slice(0, MAX_TITLE),
  }
  if (recipe.emoji) meal.e = recipe.emoji
  const mins = totalMinutes(recipe)
  if (mins > 0) meal.m = mins
  const n = recipe.nutrition
  if (n) {
    if (n.calories) meal.cal = Math.round(n.calories)
    if (n.protein) meal.p = Math.round(n.protein)
    if (n.carbs) meal.c = Math.round(n.carbs)
    if (n.fat) meal.f = Math.round(n.fat)
  }
  if (ings.length) meal.ings = ings
  return meal
}

export function buildSharePayload(recipes: Recipe[], note?: string): SharePayload {
  const meals = recipes.slice(0, 3).map(mealFromRecipe)
  const payload: SharePayload = { v: 1, meals }
  const n = note?.trim().slice(0, MAX_NOTE)
  if (n) payload.note = n
  return payload
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeSharePayload(raw: string): SharePayload | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const bin = atob(padded + pad)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const json = new TextDecoder().decode(bytes)
    const data = JSON.parse(json) as SharePayload
    if (!data || data.v !== 1 || !Array.isArray(data.meals) || !data.meals.length) return null
    return data
  } catch {
    return null
  }
}

export function shareUrlForRecipes(recipes: Recipe[], note?: string): string {
  const encoded = encodeSharePayload(buildSharePayload(recipes, note))
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/s/${encoded}`
}

export async function shareOrCopy(
  url: string,
  title: string,
  text?: string,
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: text ?? title, url })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
