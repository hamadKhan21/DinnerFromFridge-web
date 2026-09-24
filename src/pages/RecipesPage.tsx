import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PaywallError, type Recipe } from '../api/types'
import { ActiveDietBar } from '../components/ActiveDietBar'
import { DietChips } from '../components/DietChips'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { difficultyLabel, totalMinutes } from '../lib/servingScale'

export function RecipesPage() {
  const {
    deviceId,
    rememberRecipe,
    setQuota,
    refreshQuota,
    quotaRemaining,
    dietaryPreferences,
    setDietaryPreferences,
  } = useApp()
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const navigate = useNavigate()

  const search = async (query: string, prefs = dietaryPreferences) => {
    setLoading(true)
    setError(null)
    setNote(null)
    try {
      const recipes = await api.searchRecipes(query, 24, prefs)
      setResults(recipes)
      if (!recipes.length && query.trim()) setNote(t('recipes.noHits'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void search(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaryPreferences])

  const askAi = async () => {
    if (!q.trim()) return
    setAiBusy(true)
    setError(null)
    try {
      const recipes = await api.lookupRecipe(q.trim(), deviceId)
      setResults(recipes)
      setNote(recipes.length ? t('recipes.aiNote') : t('recipes.noAi'))
      await refreshQuota()
    } catch (e) {
      if (e instanceof PaywallError) {
        setQuota(e.remaining, 3 - e.remaining, 3)
        navigate('/paywall')
      } else {
        setError(e instanceof Error ? e.message : 'Lookup failed')
      }
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('recipes.title')} />
      <ActiveDietBar />
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
            placeholder={t('recipes.placeholder')}
            className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white">
            {t('common.search')}
          </button>
        </form>

        <p className="mb-2 mt-3 text-sm font-semibold text-muted">Diet</p>
        <DietChips selected={dietaryPreferences} onChange={setDietaryPreferences} compact />

        <button
          type="button"
          disabled={aiBusy || !q.trim()}
          onClick={() => void askAi()}
          className="mt-2 w-full rounded-xl border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta-dark disabled:opacity-40"
        >
          {aiBusy ? t('recipes.asking') : t('recipes.askAi', { n: quotaRemaining })}
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
                    {t('recipes.min', { n: totalMinutes(r) })} · {difficultyLabel(r.difficulty)}
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
