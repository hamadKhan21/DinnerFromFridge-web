import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium ${
    isActive ? 'text-terracotta' : 'text-muted'
  }`

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-cream">
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-terracotta/10 bg-warm-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-1">
          <NavLink to="/" end className={linkClass}>
            <span className="text-lg">🏠</span>
            Home
          </NavLink>
          <NavLink to="/recipes" className={linkClass}>
            <span className="text-lg">📖</span>
            Recipes
          </NavLink>
          <NavLink to="/nutrition" className={linkClass}>
            <span className="text-lg">💚</span>
            Nutrition
          </NavLink>
          <NavLink to="/goals" className={linkClass}>
            <span className="text-lg">🎯</span>
            Goals
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
