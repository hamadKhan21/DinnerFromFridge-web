import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

export function PaywallPage() {
  const navigate = useNavigate()
  const { quotaRemaining } = useApp()

  return (
    <div>
      <PageHeader title="Upgrade" back />
      <div className="px-6 py-6">
        <div className="text-5xl">✨</div>
        <h2 className="mt-3 text-2xl font-bold">You&apos;ve used your free AI</h2>
        <p className="mt-2 text-muted">
          Photo scans and Ask AI share {3} free uses per device. Catalog search and D1 dinner matching stay free.
          Remaining: {quotaRemaining}.
        </p>
        <p className="mt-2 text-sm text-muted">
          In-app purchases are not wired on web yet. You can keep using manual entry, browse recipes, and match dinners from the catalog.
        </p>

        <div className="mt-6 rounded-2xl border border-terracotta/15 bg-white p-5">
          <h3 className="text-lg font-extrabold text-terracotta">Pro (coming soon)</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Unlimited photo scans & Ask AI</li>
            <li>• Priority matching</li>
            <li>• Extra recipe perks</li>
          </ul>
          <button
            type="button"
            className="mt-4 w-full rounded-2xl bg-terracotta py-3 font-semibold text-white"
            onClick={() => alert('Billing is not wired on the web client yet.')}
          >
            Unlock Pro (stub)
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ingredients')}
          className="mt-6 w-full text-center font-semibold text-terracotta"
        >
          Keep manual entry
        </button>
      </div>
    </div>
  )
}
