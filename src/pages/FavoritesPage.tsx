import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { usePageSeo } from '../lib/documentMeta'
import { totalMinutes } from '../lib/servingScale'

export function FavoritesPage() {
  const { favorites, rememberRecipe } = useApp()

  usePageSeo({
    title: 'Favorite recipes | Dinner From Fridge',
    description: 'Your saved dinner recipes from Dinner From Fridge.',
    canonical: '/favorites',
  })

  return (
    <div>
      <PageHeader title="Favorites" back />
      <div className="space-y-2 px-4 py-4">
        {!favorites.length ? (
          <p className="text-center text-muted">No favorites yet. Heart a recipe to save it.</p>
        ) : (
          favorites.map((f) => (
            <Link
              key={f.recipe.id}
              to={`/recipe/${encodeURIComponent(f.recipe.id)}`}
              state={{ recipe: f.recipe }}
              onClick={() => rememberRecipe(f.recipe)}
              className="flex w-full items-start gap-3 rounded-2xl border border-terracotta/10 bg-white p-3 text-left"
            >
              <span className="text-2xl">{f.recipe.emoji}</span>
              <div>
                <div className="font-bold">{f.recipe.title}</div>
                <div className="text-xs text-muted">~{totalMinutes(f.recipe)} min</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
