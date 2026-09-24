import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Ingredient, Recipe } from '../api/types'
import { NutritionStrip } from '../components/NutritionStrip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { difficultyLabel, ingredientDisplayLabel, scaleRecipe, totalMinutes } from '../lib/servingScale'
import {
  applyPageSeo,
  buildRecipeJsonLd,
  clearJsonLd,
  setJsonLd,
} from '../lib/documentMeta'
import { shareOrCopy, shareUrlForRecipes } from '../lib/sharePayload'

/** Resolve the element that actually scrolls (overflow parent only if it overflows). */
function findActualScrollParent(el: HTMLElement | null): HTMLElement {
  let node: HTMLElement | null = el
  while (node && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node)
    const canOverflow = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (canOverflow && node.scrollHeight > node.clientHeight + 1) {
      return node
    }
    node = node.parentElement
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

function scrollMetrics(scrollEl: HTMLElement) {
  const isDoc =
    scrollEl === document.documentElement ||
    scrollEl === document.body ||
    scrollEl === document.scrollingElement
  if (isDoc) {
    const top = window.scrollY || document.documentElement.scrollTop
    const height = document.documentElement.scrollHeight
    const view = window.innerHeight
    return { top, remaining: height - top - view, viewTop: 0, viewBottom: view }
  }
  const rect = scrollEl.getBoundingClientRect()
  return {
    top: scrollEl.scrollTop,
    remaining: scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight,
    viewTop: rect.top,
    viewBottom: rect.bottom,
  }
}

/** Subtle right-side cue that more recipe content (e.g. Steps) is below the fold. */
function ScrollMoreCue({
  stepsRef,
  anchorRef,
}: {
  stepsRef: RefObject<HTMLHeadingElement | null>
  anchorRef: RefObject<HTMLElement | null>
}) {
  const [show, setShow] = useState(false)
  const scrollElRef = useRef<HTMLElement | null>(null)

  const update = useCallback(() => {
    const scrollEl = scrollElRef.current
    const steps = stepsRef.current
    if (!scrollEl) {
      setShow(false)
      return
    }

    const { remaining, viewTop, viewBottom } = scrollMetrics(scrollEl)
    const canScrollDown = remaining > 80

    let stepsBelow = false
    let stepsTopInView = false
    if (steps) {
      const stepsRect = steps.getBoundingClientRect()
      // Steps heading still below the visible scroll viewport
      stepsBelow = stepsRect.top > viewBottom - 24
      // Hide once the Steps heading top is in (or near) view
      stepsTopInView = stepsRect.top < viewBottom - 48 && stepsRect.top > viewTop - 8
    }

    // Show when there is meaningful scroll left OR Steps are still below; hide near bottom / when Steps top visible
    const nearBottom = remaining <= 80
    setShow((canScrollDown || stepsBelow) && !stepsTopInView && !nearBottom)
  }, [stepsRef])

  useEffect(() => {
    const anchor = anchorRef.current ?? stepsRef.current
    if (!anchor) return

    const listened = new Set<EventTarget>()
    let io: IntersectionObserver | null = null

    const attachIo = (scrollEl: HTMLElement) => {
      io?.disconnect()
      io = null
      if (!stepsRef.current) return
      const root =
        scrollEl === document.documentElement || scrollEl === document.body ? null : scrollEl
      io = new IntersectionObserver(() => update(), {
        root,
        rootMargin: '0px 0px -15% 0px',
        threshold: [0, 0.05, 0.25, 0.5, 1],
      })
      io.observe(stepsRef.current)
    }

    const onScrollOrResize = () => {
      const scrollEl = findActualScrollParent(anchor)
      scrollElRef.current = scrollEl
      if (!listened.has(scrollEl)) {
        scrollEl.addEventListener('scroll', onScrollOrResize, { passive: true })
        listened.add(scrollEl)
        attachIo(scrollEl)
      }
      update()
    }

    onScrollOrResize()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    listened.add(window)

    const raf = requestAnimationFrame(onScrollOrResize)
    const t = window.setTimeout(onScrollOrResize, 120)

    return () => {
      for (const target of listened) {
        target.removeEventListener('scroll', onScrollOrResize)
      }
      window.removeEventListener('resize', onScrollOrResize)
      io?.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [anchorRef, stepsRef, update])

  const onTap = () => {
    const scrollEl = scrollElRef.current
    if (!scrollEl) return
    const amount = Math.min(280, Math.round(scrollEl.clientHeight * 0.4))
    const isDoc =
      scrollEl === document.documentElement ||
      scrollEl === document.body ||
      scrollEl === document.scrollingElement
    if (isDoc) {
      window.scrollBy({ top: amount, behavior: 'smooth' })
    } else {
      scrollEl.scrollBy({ top: amount, behavior: 'smooth' })
    }
  }

  return createPortal(
    <button
      type="button"
      aria-label="More content below"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={onTap}
      className={`pointer-events-auto fixed right-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/80 text-terracotta shadow-sm ring-1 ring-terracotta/20 backdrop-blur-sm transition-opacity duration-300 ${
        show ? 'opacity-70 hover:opacity-90 animate-[dff-cue-bounce_1.6s_ease-in-out_infinite]' : 'pointer-events-none opacity-0'
      }`}
      style={{
        // Above Start cook sticky CTA + bottom nav; right edge, not covering CTAs
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
    </button>,
    document.body,
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
  const pageRootRef = useRef<HTMLDivElement>(null)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

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

  useEffect(() => {
    if (!recipe) return
    const mins = totalMinutes(recipe)
    applyPageSeo({
      title: `${recipe.title} recipe (${mins} min) | Dinner From Fridge`,
      description:
        recipe.description?.trim() ||
        `Cook ${recipe.title} in about ${mins} minutes from ingredients you may already have.`,
      canonical: `/recipe/${encodeURIComponent(recipe.id)}`,
      keywords: (recipe.tags || []).join(', '),
      type: 'article',
    })
    setJsonLd(
      'recipe',
      buildRecipeJsonLd({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        emoji: recipe.emoji,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        totalMinutes: mins,
        servings: recipe.servings,
        tags: recipe.tags,
        nutrition: recipe.nutrition,
      }),
    )
    return () => clearJsonLd('recipe')
  }, [recipe])

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
    <div ref={pageRootRef} className="pb-28">
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
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite(recipe)}
              className="text-2xl"
              aria-label="Favorite"
            >
              {isFavorite(recipe.id) ? '❤️' : '🤍'}
            </button>
            <button
              type="button"
              className="rounded-full bg-chip px-3 py-1 text-xs font-semibold text-terracotta-dark"
              onClick={() => {
                void (async () => {
                  const url = shareUrlForRecipes([recipe])
                  try {
                    const result = await shareOrCopy(url, recipe.title, recipe.description)
                    setShareMsg(result === 'shared' ? 'Shared!' : 'Copied!')
                  } catch {
                    /* cancelled */
                  }
                  window.setTimeout(() => setShareMsg(null), 2500)
                })()
              }}
            >
              Share
            </button>
            {shareMsg ? <span className="text-[10px] font-semibold text-have">{shareMsg}</span> : null}
          </div>
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

      <ScrollMoreCue stepsRef={stepsHeadingRef} anchorRef={pageRootRef} />

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
