import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function HomePage() {
  const { quotaRemaining, shopping, favorites } = useApp()
  const unchecked = shopping.filter((s) => !s.checked).length

  return (
    <div className="px-6 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">🍽️</span>
        <span className="font-extrabold text-terracotta">Dinner From Fridge</span>
        <div className="ml-auto flex gap-1">
          <Link to="/settings" className="rounded-lg p-2 text-ink hover:bg-chip" title="Settings">
            ⚙️
          </Link>
          <Link to="/shopping" className="relative rounded-lg p-2 text-ink hover:bg-chip" title="Shopping list">
            🛒
            {unchecked > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-white">
                {unchecked}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <h1 className="whitespace-pre-line text-3xl font-extrabold leading-tight text-ink">
        {"What's for\ndinner?"}
      </h1>
      <p className="mt-2 text-muted">
        Snap your fridge or type what you have — get 3 dinners you can cook tonight.
      </p>

      <div className="mt-8 space-y-3">
        <Link
          to="/capture"
          className="flex items-center gap-4 rounded-2xl bg-terracotta px-5 py-4 text-white shadow-sm"
        >
          <span className="text-3xl">📸</span>
          <div>
            <div className="font-bold">Scan fridge</div>
            <div className="text-sm text-white/80">Photo → ingredient chips</div>
          </div>
        </Link>
        <Link
          to="/ingredients"
          className="flex items-center gap-4 rounded-2xl border border-terracotta bg-white px-5 py-4 text-terracotta-dark"
        >
          <span className="text-3xl">✏️</span>
          <div>
            <div className="font-bold">Enter manually</div>
            <div className="text-sm text-muted">Type what you have</div>
          </div>
        </Link>
      </div>

      {quotaRemaining < 3 ? (
        <p className="mt-3 text-sm text-muted">
          {quotaRemaining === 1 ? '1 free AI left' : `${quotaRemaining} free AI left`}
        </p>
      ) : null}

      <Link
        to="/recipes"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-terracotta px-4 py-3 font-semibold text-terracotta-dark"
      >
        📖 Browse world recipes
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/favorites"
          className="flex items-center justify-center gap-2 rounded-2xl border border-terracotta/30 bg-white px-3 py-3 text-sm font-semibold text-ink"
        >
          ❤️ Favorites{favorites.length ? ` (${favorites.length})` : ''}
        </Link>
        <Link
          to="/week-plan"
          className="flex items-center justify-center gap-2 rounded-2xl border border-terracotta/30 bg-white px-3 py-3 text-sm font-semibold text-ink"
        >
          📅 Week plan
        </Link>
      </div>
    </div>
  )
}
