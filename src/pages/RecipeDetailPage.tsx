import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Ingredient, Recipe } from '../api/types'
import { NutritionStrip } from '../components/NutritionStrip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { difficultyLabel, ingredientDisplayLabel, scaleRecipe, totalMinutes } from '../lib/servingScale'

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

/** Subtle right-side cue that more recipe content (e.g. Steps) is below the fold. */
function ScrollMoreCue({ stepsRef }: { stepsRef: RefObject<HTMLHeadingElement | null> }) {
  const cueRef = useRef<HTMLButtonElement>(null)
  const [show, setShow] = useState(false)
  const scrollElRef = useRef<HTMLElement | null>(null)

  const update = useCallback(() => {
    const scrollEl = scrollElRef.current
    const steps = stepsRef.current
    if (!scrollEl) {
      setShow(false)
      return
    }

    const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight
    const canScrollDown = remaining > 48

    let stepsInView = false
    if (steps) {
      const scrollRect = scrollEl.getBoundingClientRect()
      const stepsRect = steps.getBoundingClientRect()
      // Visible when the Steps heading enters the lower half of the scroll viewport
      stepsInView = stepsRect.top < scrollRect.bottom - 80 && stepsRect.bottom > scrollRect.top + 40
    }

    setShow(canScrollDown && !stepsInView)
  }, [stepsRef])

  useEffect(() => {
    const anchor = cueRef.current ?? stepsRef.current
    const scrollEl = findScrollParent(anchor)
    scrollElRef.current = scrollEl
    if (!scrollEl) return

    update()
    scrollEl.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    let io: IntersectionObserver | null = null
    if (stepsRef.current) {
      io = new IntersectionObserver(
        () => update(),
        { root: scrollEl === document.documentElement ? null : scrollEl, rootMargin: '0px 0px -20% 0px', threshold: [0, 0.1, 0.5, 1] },
      )
      io.observe(stepsRef.current)
    }

    return () => {
      scrollEl.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      io?.disconnect()
    }
  }, [stepsRef, update])

  const onTap = () => {
    const scrollEl = scrollElRef.current
    if (!scrollEl) return
    const amount = Math.min(280, Math.round(scrollEl.clientHeight * 0.4))
    scrollEl.scrollBy({ top: amount, behavior: 'smooth' })
  }

  return (
    <button
      ref={cueRef}
      type="button"
      aria-label="More content below"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={onTap}
      className={`fixed right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full text-terracotta transition-opacity duration-300 ${
        show ? 'opacity-40 hover:opacity-60' : 'pointer-events-none opacity-0'
      }`}
      style={{
        // Above Start cook mode CTA + bottom nav; right edge, not covering CTAs
        bottom: 'calc(4rem + 7.25rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

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
  const stepsHeadingRef = useRef<HTMLHeadingElement>(null)

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

        <h3 ref={stepsHeadingRef} className="mt-6 font-bold">
          Steps
        </h3>
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

      <ScrollMoreCue stepsRef={stepsHeadingRef} />

      <div
        className="fixed left-0 right-0 z-40 border-t border-terracotta/10 bg-warm-white/95 px-4 py-3 backdrop-blur"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
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
