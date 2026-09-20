import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

const PREF_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'halal',
  'keto',
  'high-protein',
]

export function SettingsPage() {
  const {
    deviceId,
    quotaRemaining,
    quotaUsed,
    quotaLimit,
    refreshQuota,
    dietaryPreferences,
    setDietaryPreferences,
  } = useApp()

  const togglePref = (p: string) => {
    setDietaryPreferences(
      dietaryPreferences.includes(p)
        ? dietaryPreferences.filter((x) => x !== p)
        : [...dietaryPreferences, p],
    )
  }

  return (
    <div>
      <PageHeader title="Settings" back />
      <div className="space-y-6 px-5 py-5">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">AI quota</h2>
          <p className="mt-2 text-sm">
            Used {quotaUsed} / {quotaLimit} · {quotaRemaining} remaining
          </p>
          <p className="mt-1 text-xs text-muted">
            Photo scan + Ask AI share one free counter (catalog is free). Device id stored locally.
          </p>
          <button
            type="button"
            onClick={() => void refreshQuota()}
            className="mt-2 text-sm font-semibold text-terracotta"
          >
            Refresh quota
          </button>
          <p className="mt-2 break-all text-xs text-muted">deviceId: {deviceId}</p>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Dietary preferences</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {PREF_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePref(p)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  dietaryPreferences.includes(p)
                    ? 'bg-terracotta/20 text-terracotta-dark'
                    : 'bg-chip text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">About</h2>
          <p className="mt-2 text-sm">
            <strong>Dinner From Fridge</strong> web client. API:{' '}
            <code className="text-xs">{api.baseUrl()}</code>
          </p>
          <p className="mt-1 text-xs text-muted">Version 1.0.0 · Vite + React</p>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Privacy & terms</h2>
          <div className="mt-2 space-y-1">
            <Link to="/legal/privacy" className="block text-terracotta underline">
              Privacy policy
            </Link>
            <Link to="/legal/terms" className="block text-terracotta underline">
              Terms of use
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Cloud AI privacy: photos and Ask AI queries may be processed by our Cloudflare Worker and Gemini.
            Prefer manual entry if you do not want to upload photos.
          </p>
        </section>
      </div>
    </div>
  )
}
