import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PaywallError, type Recipe } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { difficultyLabel, totalMinutes } from '../lib/servingScale'

export function RecipesPage() {
  const { deviceId, rememberRecipe, setQuota, refreshQuota, quotaRemaining } = useApp()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const navigate = useNavigate()

  const search = async (query: string) => {
    setLoading(true)
    setError(null)
    setNote(null)
    try {
      const recipes = await api.searchRecipes(query, 24)
      setResults(recipes)
      if (!recipes.length && query.trim()) setNote('No catalog hits. Try Ask AI.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void search('')
  }, [])

  const askAi = async () => {
    if (!q.trim()) return
    setAiBusy(true)
    setError(null)
    try {
      const recipes = await api.lookupRecipe(q.trim(), deviceId)
      setResults(recipes)
      setNote(recipes.length ? 'AI recipe lookup (uses shared free quota).' : 'No AI results.')
      await refreshQuota()
    } catch (e) {
      if (e instanceof PaywallError) {
        setQuota(e.remaining, 3 - e.remaining, 3)
        navigate('/paywall')
      } else {
        setError(e instanceof Error ? e.message : 'Ask AI failed')
      }
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Recipes" />
      <div className="px-4 py-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void search(q)
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white">
            Search
          </button>
        </form>
        <button
          type="button"
          disabled={aiBusy || !q.trim()}
          onClick={() => void askAi()}
          className="mt-2 w-full rounded-xl border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta-dark disabled:opacity-40"
        >
          {aiBusy ? 'Asking AI…' : `✨ Ask AI for recipe (${quotaRemaining} free left)`}
        </button>
        {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
        {error ? <p className="mt-2 text-sm text-missing">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {results.map((r) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
