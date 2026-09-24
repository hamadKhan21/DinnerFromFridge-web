import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium ${
    isActive ? 'text-terracotta' : 'text-muted'
  }`

export function Layout() {
  const { t } = useI18n()
  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-cream">
      <main
        className="min-h-0 flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
      >
        <Outlet />
      </main>
      <nav
        className="print:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-terracotta/10 bg-warm-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-lg justify-around px-2 py-1">
          <NavLink to="/" end className={linkClass}>
            <span className="text-lg">🏠</span>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/recipes" className={linkClass}>
            <span className="text-lg">📖</span>
            {t('nav.recipes')}
          </NavLink>
          <NavLink to="/nutrition" className={linkClass}>
            <span className="text-lg">💚</span>
            {t('nav.nutrition')}
          </NavLink>
          <NavLink to="/goals" className={linkClass}>
            <span className="text-lg">🎯</span>
            {t('nav.goals')}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
