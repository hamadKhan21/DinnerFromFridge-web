import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { renderRecipeStory } from '../lib/storyCard'
import { ShareSheet } from './ShareSheet'

export interface StoryRecipe {
  id: string
  title: string
  emoji: string
  minutes: number
  ingredients: string[]
}

/** Story share sheet for one recipe (optionally with the user's fridge photo). */
export function RecipeStoryShare({
  open,
  onClose,
  recipe,
  photo,
  url,
  kicker,
  shareText,
}: {
  open: boolean
  onClose: () => void
  recipe: StoryRecipe
  photo?: string | null
  url?: string
  kicker?: string
  shareText?: string
}) {
  const { t, dir } = useI18n()
  const [withPhoto, setWithPhoto] = useState(true)
  const usePhoto = !!photo && withPhoto
  const link = url ?? `${window.location.origin}/recipe/${encodeURIComponent(recipe.id)}`
  return (
    <ShareSheet
      open={open}
      onClose={onClose}
      title={t('share.storyTitle')}
      url={link}
      text={shareText ?? t('share.recipeText', { title: recipe.title, n: recipe.minutes })}
      fileName={`${recipe.id.slice(0, 40)}-story.jpg`}
      renderKey={`${recipe.id}-${usePhoto ? 1 : 0}-${dir}`}
      makeImage={() =>
        renderRecipeStory({
          title: recipe.title,
          emoji: recipe.emoji,
          minutes: recipe.minutes,
          ingredients: recipe.ingredients,
          photo: usePhoto ? photo : null,
          kicker: kicker ?? (usePhoto ? t('story.kickerFridge') : t('story.kickerTonight')),
          minutesLabel: t('story.minutes', { n: recipe.minutes }),
          ingredientsLabel: t('story.keyIngredients'),
          cta: t('story.cta'),
          dir,
        })
      }
    >
      {photo ? (
        <label className="flex items-center justify-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} className="h-4 w-4 accent-terracotta" />
          {t('share.includePhoto')}
        </label>
      ) : null}
    </ShareSheet>
  )
}

/** Key ingredients for a story card: skip salt/oil/water style staples. */
export function keyIngredients(names: string[], max = 6): string[] {
  const skip = /^(salt|oil|olive oil|water|pepper|black pepper|sugar|vegetable oil|cooking oil)$/i
  const out: string[] = []
  for (const raw of names) {
    const n = raw.split(',')[0]!.replace(/\(.*?\)/g, '').trim()
    if (!n || skip.test(n)) continue
    const nice = n.charAt(0).toUpperCase() + n.slice(1)
    if (!out.some((o) => o.toLowerCase() === nice.toLowerCase())) out.push(nice)
    if (out.length >= max) break
  }
  return out
}
