import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mealMatchFromRecipe, recipeFromJson } from '../api/mapper'
import type { Recipe } from '../api/types'
import { MealCard } from '../components/MealCard'
import { PageHeader } from '../components/PageHeader'
import { keyIngredients, RecipeStoryShare } from '../components/RecipeStoryShare'
import { SnapButton } from '../components/SnapButton'
import { useApp } from '../context/AppContext'
import sample from '../data/sampleFridge.json'
import { useI18n } from '../i18n/I18nContext'
import { usePageSeo } from '../lib/documentMeta'
import { totalMinutes } from '../lib/servingScale'

const SAMPLE_PHOTO = '/sample-fridge.jpg'

/**
 * Pre-baked demo: a real fridge photo + the result a scan would give.
 * Static data only — no scan, no network AI call, no free-use quota touched.
 */
export function SampleFridgePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { rememberRecipe, setIngredients } = useApp()
  const [storyFor, setStoryFor] = useState<Recipe | null>(null)

  usePageSeo({
    title: 'Try a sample fridge — see Dinner From Fridge in one tap',
    description: 'See how a fridge photo turns into 3 dinners you can cook tonight. Free demo — no sign-up.',
    canonical: '/sample-fridge',
    image: '/og/sample.jpg',
  })

  const ingredients = useMemo(() => sample.ingredients.map((name) => ({ name })), [])
  const matches = useMemo(
    () =>
      (sample.recipes as unknown as Record<string, unknown>[])
        .map((r, i) => recipeFromJson(r, i))
        .filter((r): r is Recipe => !!r)
        .map((r) => mealMatchFromRecipe(r, ingredients)),
    [ingredients],
  )

  return (
    <div>
      <PageHeader title={t('sample.title')} back />
      <div className="px-5 py-4">
        <div className="rounded-2xl bg-chip/70 px-4 py-3 text-sm font-semibold text-terracotta-dark">{t('sample.banner')}</div>

        <div className="relative mt-4 overflow-hidden rounded-3xl shadow-md">
          <img src={SAMPLE_PHOTO} alt={t('sample.photoAlt')} className="aspect-[3/2] w-full object-cover" />
          <span className="absolute start-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
            {t('sample.photoTag')}
          </span>
        </div>

        <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">{t('sample.found', { n: ingredients.length })}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ingredients.map((i) => (
            <span key={i.name} className="rounded-full bg-sage/15 px-3 py-1 text-sm font-medium text-have">
              {i.name}
            </span>
          ))}
        </div>

        <h2 className="mt-6 text-xl font-extrabold text-ink">{t('sample.dinners')}</h2>
        <div className="mt-3 space-y-3">
          {matches.map((m) => (
            <div key={m.recipe.id}>
              <MealCard
                match={m}
                onClick={() => {
                  rememberRecipe(m.recipe)
                  navigate(`/recipe/${encodeURIComponent(m.recipe.id)}`, {
                    state: { recipe: m.recipe, have: m.have, missing: m.missing },
                  })
                }}
              />
              <button
                type="button"
                onClick={() => setStoryFor(m.recipe)}
                className="mt-1 w-full py-1.5 text-center text-sm font-semibold text-terracotta"
              >
                📲 {t('share.shareStory')}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark p-5 text-white shadow-lg">
          <p className="text-lg font-extrabold">{t('sample.ctaTitle')}</p>
          <p className="mt-1 text-sm text-white/85">{t('sample.ctaHint')}</p>
          <div className="mt-4">
            <SnapButton label={t('hero.snap')} hint={t('hero.snapHint')} />
          </div>
          <button
            type="button"
            onClick={() => {
              setIngredients(ingredients)
              navigate('/ingredients')
            }}
            className="mt-3 w-full text-center text-sm font-semibold text-white/90 underline"
          >
            {t('sample.editThese')}
          </button>
        </div>

        <Link to="/leftover-rescue" className="mt-4 block text-center text-sm font-semibold text-terracotta">
          {t('leftovers.homeTile')} →
        </Link>
      </div>

      {storyFor ? (
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
          photo={SAMPLE_PHOTO}
        />
      ) : null}
    </div>
  )
}
