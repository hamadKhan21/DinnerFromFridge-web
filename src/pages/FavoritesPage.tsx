import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { totalMinutes } from '../lib/servingScale'

export function FavoritesPage() {
  const { favorites, rememberRecipe } = useApp()
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Favorites" back />
      <div className="space-y-2 px-4 py-4">
        {!favorites.length ? (
          <p className="text-center text-muted">No favorites yet. Heart a recipe to save it.</p>
        ) : (
          favorites.map((f) => (
            <button
              key={f.recipe.id}
              type="button"
              className="flex w-full items-start gap-3 rounded-2xl border border-terracotta/10 bg-white p-3 text-left"
              onClick={() => {
                rememberRecipe(f.recipe)
                navigate(`/recipe/${encodeURIComponent(f.recipe.id)}`, { state: { recipe: f.recipe } })
              }}
            >
              <span className="text-2xl">{f.recipe.emoji}</span>
              <div>
                <div className="font-bold">{f.recipe.title}</div>
                <div className="text-xs text-muted">~{totalMinutes(f.recipe)} min</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
