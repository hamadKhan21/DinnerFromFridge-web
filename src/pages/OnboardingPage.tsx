import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const PAGES = [
  {
    emoji: '🍽️',
    title: 'Dinner From Fridge',
    body: 'Snap your fridge or type what you have — get dinners you can cook tonight.',
  },
  {
    emoji: '📖',
    title: 'Recipes & cook mode',
    body: 'Browse the catalog, scale servings, and follow sticky cook steps with timers.',
  },
  {
    emoji: '🛒',
    title: 'Plan your week',
    body: 'Save favorites, build a shopping list, and generate a weekly meal plan.',
  },
]

export function OnboardingPage() {
  const { completeOnboarding } = useApp()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const finish = () => {
    completeOnboarding()
    navigate('/', { replace: true })
  }

  const p = PAGES[page]
  return (
    <div className="flex min-h-dvh flex-col bg-cream px-6 py-8">
      <div className="flex justify-end">
        <button type="button" onClick={finish} className="text-sm text-muted">
          Skip
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <img src="/app-icon.png" alt="" className="mb-6 h-14 w-14 rounded-2xl object-cover" />
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-terracotta/10 text-5xl">
          {p.emoji}
        </div>
        <h1 className="text-2xl font-extrabold text-ink">{p.title}</h1>
        <p className="mt-3 max-w-sm text-muted">{p.body}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {PAGES.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i === page ? 'bg-terracotta' : 'bg-chip'}`}
            />
          ))}
        </div>
        {page < PAGES.length - 1 ? (
          <button
            type="button"
            onClick={() => setPage((x) => x + 1)}
            className="rounded-2xl bg-terracotta px-6 py-3 font-semibold text-white"
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={finish} className="rounded-2xl bg-terracotta px-6 py-3 font-semibold text-white">
            Get started
          </button>
        )}
      </div>
    </div>
  )
}
