import { useNavigate } from 'react-router-dom'

export function PageHeader({ title, back }: { title: string; back?: boolean }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-terracotta/10 bg-cream/95 px-4 py-3 backdrop-blur">
      {back ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-2 py-1 text-terracotta hover:bg-chip"
          aria-label="Back"
        >
          ←
        </button>
      ) : null}
      <h1 className="text-lg font-bold text-ink">{title}</h1>
    </header>
  )
}
