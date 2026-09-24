import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Recipe } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { buildItemListJsonLd, usePageSeo } from '../lib/documentMeta'
import { CUISINE_LANDINGS, cuisineLandingBySlug } from '../lib/seoLandings'
import { difficultyLabel, totalMinutes } from '../lib/servingScale'

function matchesCuisine(r: Recipe, keywords: readonly string[]): boolean {
  const hay = `${r.title} ${r.description} ${(r.tags || []).join(' ')}`.toLowerCase()
  return keywords.some((k) => hay.includes(k.toLowerCase()))
}

export function CuisineLandingPage() {
  const { slug = '' } = useParams()
  const landing = cuisineLandingBySlug(slug)
  const { rememberRecipe, dietaryPreferences } = useApp()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageSeo(
    landing
      ? {
          title: `${landing.label} recipes you can cook from your fridge | Dinner From Fridge`,
          description: landing.intro,
          canonical: `/cuisine/${landing.slug}`,
          keywords: `${landing.label}, fridge recipes, leftover dinner`,
        }
      : null,
    landing && recipes.length
      ? [
          {
            id: 'collection',
            data: buildItemListJsonLd(
              `${landing.label} recipes`,
              landing.intro,
              `/cuisine/${landing.slug}`,
              recipes.map((r) => ({ id: r.id, title: r.title })),
            ),
          },
        ]
      : undefined,
  )

  useEffect(() => {
    if (!landing) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const primary = await api.searchRecipes(landing.keywords[0] || landing.slug, 36, dietaryPreferences)
        let list = primary.filter((r) => matchesCuisine(r, landing.keywords))
        if (list.length < 6) {
          const broader = await api.searchRecipes('', 48, dietaryPreferences)
          const ids = new Set(list.map((r) => r.id))
          for (const r of broader) {
            if (ids.has(r.id)) continue
            if (matchesCuisine(r, landing.keywords)) {
              list.push(r)
              ids.add(r.id)
            }
          }
        }
        if (!cancelled) setRecipes(list.slice(0, 24))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [landing, dietaryPreferences])

  if (!landing) return <Navigate to="/" replace />

  return (
    <div>
      <PageHeader title={landing.label} back />
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold text-ink">{landing.label} dinners</h1>
        <p className="mt-2 text-sm text-muted">{landing.intro}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {CUISINE_LANDINGS.map((c) => (
            <Link
              key={c.slug}
              to={`/cuisine/${c.slug}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                c.slug === landing.slug ? 'bg-terracotta/20 text-terracotta-dark' : 'bg-chip text-ink'
              }`}
            >
              {c.label.split(' / ')[0]}
            </Link>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-missing">{error}</p> : null}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recipes.map((r) => (
              <Link
                key={r.id}
                to={`/recipe/${encodeURIComponent(r.id)}`}
                state={{ recipe: r }}
                onClick={() => rememberRecipe(r)}
                className="flex w-full items-start gap-3 rounded-2xl border border-terracotta/10 bg-white p-3 text-left"
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-xs text-muted">
                    ~{totalMinutes(r)} min · {difficultyLabel(r.difficulty)}
                  </div>
                </div>
              </Link>
            ))}
            {!recipes.length ? (
              <p className="mt-8 text-center text-muted">No matching recipes yet — try browsing all recipes.</p>
            ) : null}
          </div>
        )}

        <Link to="/recipes" className="mt-6 block text-center font-semibold text-terracotta">
          Browse all recipes →
        </Link>
      </div>
    </div>
  )
}
