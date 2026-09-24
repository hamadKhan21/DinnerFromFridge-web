import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TonightFilters } from '../api/types'
import { ActiveDietBar } from '../components/ActiveDietBar'
import { DietChips } from '../components/DietChips'
import { FilterChips } from '../components/FilterChips'
import { MealCard } from '../components/MealCard'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { shareOrCopy, shareUrlForRecipes } from '../lib/sharePayload'
import { usePageSeo } from '../lib/documentMeta'

const NOTE: Record<string, string> = {
  cloudRecipes: 'Matched from the catalog (free).',
  aiDinners: 'AI suggestions — catalog match was weak.',
  localRecipes: 'Local matches.',
  cachedAi: 'From recent AI cache.',
}

export function SuggestionsPage() {
  const {
    suggestions,
    suggestionsLoading,
    suggestionsNote,
    computeSuggestions,
    tonightFilters,
    setTonightFilters,
    rememberRecipe,
    dietaryPreferences,
    setDietaryPreferences,
  } = useApp()
  const navigate = useNavigate()
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  usePageSeo({
    title: 'Tonight\'s dinner suggestions | Dinner From Fridge',
    description: 'Dinner ideas matched to your fridge ingredients — leftovers welcome.',
    canonical: '/suggestions',
  })


  useEffect(() => {
    void computeSuggestions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void computeSuggestions()
  }, [dietaryPreferences]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (f: TonightFilters) => {
    setTonightFilters(f)
    void computeSuggestions(f)
  }

  const onShare = async () => {
    if (!suggestions.length) return
    const recipes = suggestions.slice(0, 3).map((m) => m.recipe)
    const url = shareUrlForRecipes(recipes)
    try {
      const result = await shareOrCopy(
        url,
        "Tonight's dinners · Dinner From Fridge",
        recipes.map((r) => r.title).join(', '),
      )
      setShareMsg(result === 'shared' ? 'Shared!' : 'Link copied!')
    } catch {
      /* cancelled */
    }
    window.setTimeout(() => setShareMsg(null), 2500)
  }

  return (
    <div>
      <PageHeader title="Tonight's picks" back />
      <ActiveDietBar />
      <div className="px-4 py-4">
        <p className="mb-2 text-sm font-semibold text-muted">Tonight filters</p>
        <FilterChips filters={tonightFilters} disabled={suggestionsLoading} onChange={applyFilter} />

        <p className="mb-2 mt-4 text-sm font-semibold text-muted">Diet</p>
        <DietChips
          selected={dietaryPreferences}
          onChange={setDietaryPreferences}
          disabled={suggestionsLoading}
          compact
        />

        {suggestions.length > 0 && !suggestionsLoading ? (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onShare()}
              className="flex-1 rounded-2xl bg-terracotta py-3 font-bold text-white shadow"
            >
              Share dinners
            </button>
            {shareMsg ? <span className="text-sm font-semibold text-have">{shareMsg}</span> : null}
          </div>
        ) : null}

        {suggestionsNote ? (
          <p className="mt-3 text-xs text-muted">{NOTE[suggestionsNote] ?? suggestionsNote}</p>
        ) : null}

        {suggestionsLoading ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
            <p>Finding dinners…</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {suggestions.map((m) => (
              <MealCard
                key={m.recipe.id}
                match={m}
                onClick={() => {
                  rememberRecipe(m.recipe)
                  navigate(`/recipe/${encodeURIComponent(m.recipe.id)}`, {
                    state: { recipe: m.recipe, have: m.have, missing: m.missing },
                  })
                }}
              />
            ))}
            {!suggestions.length ? (
              <p className="mt-8 text-center text-muted">
                No matches yet. Add more ingredients or clear filters.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
