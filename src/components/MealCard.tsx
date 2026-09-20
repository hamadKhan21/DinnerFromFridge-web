import type { MealMatch } from '../api/types'
import { difficultyLabel, totalMinutes } from '../lib/servingScale'

export function MealCard({
  match,
  onClick,
}: {
  match: MealMatch
  onClick?: () => void
}) {
  const { recipe, have, missing, useSoonCount } = match
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-terracotta/10 bg-white p-4 text-left shadow-sm transition hover:border-terracotta/30"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{recipe.emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink">{recipe.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{recipe.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
            <span>~{totalMinutes(recipe)} min</span>
            <span>·</span>
            <span>{difficultyLabel(recipe.difficulty)}</span>
            {useSoonCount ? (
              <>
                <span>·</span>
                <span className="text-terracotta">Uses {useSoonCount} soon</span>
              </>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {have.slice(0, 4).map((h) => (
              <span key={h.name} className="rounded-full bg-sage/15 px-2 py-0.5 text-xs text-have">
                {h.name}
              </span>
            ))}
            {missing.slice(0, 3).map((m) => (
              <span key={m.name} className="rounded-full bg-missing/10 px-2 py-0.5 text-xs text-missing">
                need {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
