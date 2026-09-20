import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Ingredient, Recipe } from '../api/types'
import { NutritionStrip } from '../components/NutritionStrip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { difficultyLabel, ingredientDisplayLabel, scaleRecipe, totalMinutes } from '../lib/servingScale'

export function RecipeDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { recipe?: Recipe; have?: Ingredient[]; missing?: Ingredient[] } | null
  const { isFavorite, toggleFavorite, addMissingToShopping, getCachedRecipe, rememberRecipe } = useApp()

  const [recipe, setRecipe] = useState<Recipe | null>(
    state?.recipe ?? getCachedRecipe(decodeURIComponent(id)) ?? null,
  )
  const [have] = useState(state?.have ?? [])
  const [missing] = useState(state?.missing ?? [])
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [baseServings] = useState(recipe?.servings ?? 4)
  const [loading, setLoading] = useState(!recipe)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (recipe) {
      rememberRecipe(recipe)
      setServings(recipe.servings)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.getRecipe(decodeURIComponent(id))
        if (cancelled) return
        if (!r) {
          setError('Recipe not found')
        } else {
          setRecipe(r)
          setServings(r.servings)
          rememberRecipe(r)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const scaled = useMemo(() => (recipe ? scaleRecipe({ ...recipe, servings: baseServings }, servings) : null), [
    recipe,
    servings,
    baseServings,
  ])

  if (loading && !recipe) {
    return (
      <div>
        <PageHeader title="Recipe" back />
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
        </div>
      </div>
    )
  }

  if (!scaled || !recipe) {
    return (
      <div>
        <PageHeader title="Recipe" back />
        <p className="p-6 text-missing">{error ?? 'Not found'}</p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <PageHeader title={scaled.title} back />
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{scaled.emoji}</span>
          <div className="flex-1">
            <p className="text-muted">{scaled.description}</p>
            <p className="mt-2 text-sm text-muted">
              ~{totalMinutes(scaled)} min · {difficultyLabel(scaled.difficulty)} · {scaled.servings} servings
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(recipe)}
            className="text-2xl"
            aria-label="Favorite"
          >
            {isFavorite(recipe.id) ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-semibold text-muted">Servings</span>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-chip font-bold"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
          >
            −
          </button>
          <span className="w-6 text-center font-bold">{servings}</span>
          <button
            type="button"
            className="h-9 w-9 rounded-full bg-chip font-bold"
            onClick={() => setServings((s) => Math.min(8, s + 1))}
          >
            +
          </button>
        </div>

        <NutritionStrip nutrition={scaled.nutrition} label="Nutrition (scaled)" />

        <h3 className="mt-6 font-bold">Ingredients</h3>
        <ul className="mt-2 space-y-1.5">
          {scaled.ingredients.map((ing, i) => (
            <li key={`${ing.name}-${i}`} className="text-sm">
              {ingredientDisplayLabel(ing)}
            </li>
          ))}
        </ul>

        {(have.length > 0 || missing.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {have.map((h) => (
              <span key={h.name} className="rounded-full bg-sage/15 px-2 py-0.5 text-xs text-have">
                have {h.name}
              </span>
            ))}
            {missing.map((m) => (
              <span key={m.name} className="rounded-full bg-missing/10 px-2 py-0.5 text-xs text-missing">
                need {m.name}
              </span>
            ))}
          </div>
        )}

        {missing.length > 0 ? (
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-terracotta"
            onClick={() => addMissingToShopping(missing)}
          >
            + Add missing to shopping list
          </button>
        ) : null}

        <h3 className="mt-6 font-bold">Steps</h3>
        <ol className="mt-2 list-decimal space-y-3 pl-5">
          {scaled.steps.map((s, i) => (
            <li key={i} className="text-sm">
              {s.instruction}
              {s.timerSeconds ? (
                <span className="ml-2 text-xs text-muted">⏱ {Math.round(s.timerSeconds / 60)} min</span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-terracotta/10 bg-warm-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() =>
              navigate(`/cook/${encodeURIComponent(recipe.id)}`, {
                state: { recipe: scaled },
              })
            }
            className="w-full rounded-2xl bg-terracotta py-3.5 font-bold text-white shadow"
          >
            Start cook mode
          </button>
          <Link to="/shopping" className="mt-2 block text-center text-sm text-muted">
            Shopping list
          </Link>
        </div>
      </div>
    </div>
  )
}
