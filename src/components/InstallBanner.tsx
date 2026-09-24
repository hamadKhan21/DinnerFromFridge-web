import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'dff_install_dismissed'

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (hidden || !deferred) return null

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-terracotta/20 bg-white px-4 py-3 shadow-sm">
      <span className="text-2xl" aria-hidden>
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">Install app</p>
        <p className="text-xs text-muted">Add Dinner From Fridge to your home screen.</p>
      </div>
      <button
        type="button"
        className="rounded-xl bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
        onClick={async () => {
          await deferred.prompt()
          setDeferred(null)
        }}
      >
        Install
      </button>
      <button
        type="button"
        className="text-muted"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, '1')
          } catch {
            /* ignore */
          }
          setHidden(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
