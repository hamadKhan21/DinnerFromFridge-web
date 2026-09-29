import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TonightFilters } from '../api/types'
import { ActiveDietBar } from '../components/ActiveDietBar'
import { DietChips } from '../components/DietChips'
import { FilterChips } from '../components/FilterChips'
import { MealCard } from '../components/MealCard'
import { keyIngredients, RecipeStoryShare } from '../components/RecipeStoryShare'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { shareOrCopy, shareUrlForRecipes } from '../lib/sharePayload'
import { usePageSeo } from '../lib/documentMeta'
import { totalMinutes } from '../lib/servingScale'
import { loadFridgeThumb } from '../lib/storyCard'
import { useI18n } from '../i18n/I18nContext'
import type { Recipe } from '../api/types'

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
  const [storyFor, setStoryFor] = useState<Recipe | null>(null)
  const { t } = useI18n()
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
              {t('share.shareDinners')}
            </button>
            <button
              type="button"
              onClick={() => setStoryFor(suggestions[0]!.recipe)}
              className="flex-1 rounded-2xl border border-terracotta bg-white py-3 font-bold text-terracotta-dark"
            >
              📲 {t('share.shareStory')}
            </button>
            {shareMsg ? <span className="text-sm font-semibold text-have">{shareMsg}</span> : null}
          </div>
        ) : null}
        {storyFor ? (
          <>
            <RecipeStoryShare
              open
              onClose={() => setStoryFor(null)}
              recipe={{
                id: storyFor.id,
                title: storyFor.title,
                emoji: storyFor.emoji,
                minutes: totalMinutes(storyFor),
                ingredients: keyIngredients(storyFor.ingredients.map((i) => i.name)),
              }}
              photo={loadFridgeThumb()}
              url={shareUrlForRecipes(suggestions.slice(0, 3).map((m) => m.recipe))}
            />
            {suggestions.length > 1 ? (
              <div className="fixed inset-x-0 top-3 z-[90] mx-auto flex max-w-lg justify-center gap-2 px-4">
                {suggestions.slice(0, 3).map((m) => (
                  <button
                    key={m.recipe.id}
                    type="button"
                    onClick={() => setStoryFor(m.recipe)}
                    className={`max-w-[33%] truncate rounded-full px-3 py-1.5 text-xs font-bold shadow ${
                      storyFor.id === m.recipe.id ? 'bg-terracotta text-white' : 'bg-white text-ink'
                    }`}
                  >
                    {m.recipe.emoji} {m.recipe.title}
                  </button>
                ))}
              </div>
            ) : null}
          </>
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
