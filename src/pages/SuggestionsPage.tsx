import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterChips } from '../components/FilterChips'
import { MealCard } from '../components/MealCard'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import type { TonightFilters } from '../api/types'

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
  } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    void computeSuggestions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (f: TonightFilters) => {
    setTonightFilters(f)
    void computeSuggestions(f)
  }

  return (
    <div>
      <PageHeader title="Tonight's picks" back />
      <div className="px-4 py-4">
        <p className="mb-2 text-sm font-semibold text-muted">Tonight filters</p>
        <FilterChips filters={tonightFilters} disabled={suggestionsLoading} onChange={applyFilter} />

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
              <p className="mt-8 text-center text-muted">No matches yet. Add more ingredients or clear filters.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
