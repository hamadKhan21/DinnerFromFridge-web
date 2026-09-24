import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Recipe } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { setDocumentMeta } from '../lib/documentMeta'
import { COOK_TIME_LANDINGS, cookLandingBySlug } from '../lib/seoLandings'
import { difficultyLabel, totalMinutes } from '../lib/servingScale'

export function CookLandingPage() {
  const { id: slug = '' } = useParams()
  const landing = cookLandingBySlug(slug)
  const { rememberRecipe, dietaryPreferences } = useApp()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!landing) return
    setDocumentMeta(`${landing.label} · Dinner From Fridge`, landing.intro)
  }, [landing])

  useEffect(() => {
    if (!landing) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const all = await api.searchRecipes('', 48, dietaryPreferences)
        const filtered = all
          .filter((r) => totalMinutes(r) > 0 && totalMinutes(r) <= landing.maxMinutes)
          .slice(0, 24)
        if (!cancelled) setRecipes(filtered)
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
        <h1 className="text-2xl font-extrabold text-ink">{landing.label}</h1>
        <p className="mt-2 text-sm text-muted">{landing.intro}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {COOK_TIME_LANDINGS.map((c) => (
            <Link
              key={c.slug}
              to={`/cook/${c.slug}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                c.slug === landing.slug ? 'bg-terracotta/20 text-terracotta-dark' : 'bg-chip text-ink'
              }`}
            >
              ≤{c.maxMinutes} min
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
              <button
                key={r.id}
                type="button"
                className="flex w-full items-start gap-3 rounded-2xl border border-terracotta/10 bg-white p-3 text-left"
                onClick={() => {
                  rememberRecipe(r)
                  navigate(`/recipe/${encodeURIComponent(r.id)}`, { state: { recipe: r } })
                }}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-xs text-muted">
                    ~{totalMinutes(r)} min · {difficultyLabel(r.difficulty)}
                  </div>
                </div>
              </button>
            ))}
            {!recipes.length ? (
              <p className="mt-8 text-center text-muted">No recipes in this time range yet.</p>
            ) : null}
          </div>
        )}

        <Link to="/capture" className="mt-6 block text-center font-semibold text-terracotta">
          Scan your fridge for tonight&apos;s picks →
        </Link>
      </div>
    </div>
  )
}
