import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Recipe } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { ingredientDisplayLabel } from '../lib/servingScale'

export function CookModePage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { getCachedRecipe } = useApp()
  const initial = (location.state as { recipe?: Recipe } | null)?.recipe
  const [recipe, setRecipe] = useState<Recipe | null>(initial ?? getCachedRecipe(decodeURIComponent(id)) ?? null)
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [timerLeft, setTimerLeft] = useState<number | null>(null)

  useEffect(() => {
    if (recipe) return
    void api.getRecipe(decodeURIComponent(id)).then((r) => {
      if (r) setRecipe(r)
    })
  }, [id, recipe])

  const current = recipe?.steps[step]
  const total = recipe?.steps.length ?? 0

  useEffect(() => {
    if (timerLeft == null || timerLeft <= 0) return
    const t = setInterval(() => setTimerLeft((x) => (x == null ? null : Math.max(0, x - 1))), 1000)
    return () => clearInterval(t)
  }, [timerLeft])

  const progress = useMemo(() => (total ? ((step + 1) / total) * 100 : 0), [step, total])

  if (!recipe) {
    return (
      <div>
        <PageHeader title="Cook mode" back />
        <p className="p-6 text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Cook mode" back />
      <div className="h-1 bg-chip">
        <div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 px-5 py-6">
        <p className="text-sm font-semibold text-muted">
          Step {step + 1} of {total} · {recipe.emoji} {recipe.title}
        </p>
        <p className="mt-4 text-xl font-semibold leading-relaxed text-ink">{current?.instruction}</p>

        {current?.timerSeconds ? (
          <div className="mt-6 rounded-2xl bg-chip p-4">
            <p className="text-sm text-muted">Step timer</p>
            <p className="text-3xl font-bold text-terracotta">
              {timerLeft != null
                ? `${Math.floor(timerLeft / 60)}:${String(timerLeft % 60).padStart(2, '0')}`
                : `${Math.round(current.timerSeconds / 60)} min`}
            </p>
            <button
              type="button"
              className="mt-2 rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setTimerLeft(current.timerSeconds!)}
            >
              Start timer
            </button>
          </div>
        ) : null}

        <details className="mt-8">
          <summary className="cursor-pointer font-semibold text-muted">Ingredients</summary>
          <ul className="mt-2 space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                />
                <span className={checked[i] ? 'line-through text-muted' : ''}>
                  {ingredientDisplayLabel(ing)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-terracotta/10 bg-warm-white p-4">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => {
            setStep((s) => s - 1)
            setTimerLeft(null)
          }}
          className="flex-1 rounded-2xl border border-terracotta py-3 font-semibold text-terracotta-dark disabled:opacity-40"
        >
          Back
        </button>
        {step < total - 1 ? (
          <button
            type="button"
            onClick={() => {
              setStep((s) => s + 1)
              setTimerLeft(null)
            }}
            className="flex-1 rounded-2xl bg-terracotta py-3 font-semibold text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-2xl bg-sage py-3 font-semibold text-white"
          >
            Done 🎉
          </button>
        )}
      </div>
    </div>
  )
}
