import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { applyPageSeo } from '../lib/documentMeta'
import { decodeSharePayload } from '../lib/sharePayload'

export function SharePage() {
  const { payload: raw = '' } = useParams()
  const data = useMemo(() => decodeSharePayload(raw), [raw])

  useEffect(() => {
    if (!data) {
      applyPageSeo({
        title: 'Shared dinners | Dinner From Fridge',
        description: 'Shared dinner ideas from Dinner From Fridge.',
        canonical: '/s/' + raw,
        noIndex: true,
      })
      return
    }
    const titles = data.meals.map((m) => m.t).join(', ')
    applyPageSeo({
      title: `${titles} | Dinner From Fridge`,
      description: data.note || `Dinner ideas to cook tonight: ${titles}`,
      canonical: `/s/${raw}`,
    })
  }, [data, raw])

  if (!data) {
    return (
      <div>
        <PageHeader title="Shared dinners" back />
        <div className="px-5 py-8 text-center">
          <p className="text-muted">This share link is invalid or expired.</p>
          <Link to="/capture" className="mt-4 inline-block font-semibold text-terracotta">
            Scan your fridge
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-terracotta/10 bg-cream/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-terracotta">
          <span aria-hidden>🍽️</span>
          Dinner From Fridge
        </Link>
      </header>
      <div className="px-5 py-5">
        <h1 className="text-2xl font-extrabold text-ink">Tonight&apos;s dinners</h1>
        <p className="mt-1 text-sm text-muted">
          Shared meal ideas — open a recipe or scan your fridge for matches.
        </p>
        {data.note ? (
          <p className="mt-3 rounded-xl bg-chip/60 px-3 py-2 text-sm text-ink">{data.note}</p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {data.meals.map((m) => (
            <li key={m.id} className="rounded-2xl border border-terracotta/10 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{m.e || '🍽️'}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-ink">{m.t}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                    {m.m != null ? <span>~{m.m} min</span> : null}
                    {m.cal != null ? (
                      <span>
                        {m.cal} kcal
                        {m.p != null ? ` · P ${m.p}g` : ''}
                        {m.c != null ? ` · C ${m.c}g` : ''}
                        {m.f != null ? ` · F ${m.f}g` : ''}
                      </span>
                    ) : null}
                  </div>
                  {m.ings?.length ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{m.ings.join(' · ')}</p>
                  ) : null}
                  <Link
                    to={`/recipe/${encodeURIComponent(m.id)}`}
                    className="mt-3 inline-block rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open recipe
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <Link
            to="/capture"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta px-4 py-3.5 font-bold text-white shadow"
          >
            📸 Scan your fridge
          </Link>
          <Link
            to="/recipes"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-terracotta px-4 py-3 font-semibold text-terracotta-dark"
          >
            Browse recipes
          </Link>
        </div>
      </div>
    </div>
  )
}
