import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { CatalogEntry } from '../lib/catalogMatch'

export function CatalogCard({
  entry,
  used,
  missing,
}: {
  entry: CatalogEntry
  used?: string[]
  missing?: string[]
}) {
  const { t } = useI18n()
  return (
    <Link
      to={`/recipe/${encodeURIComponent(entry.id)}`}
      className="flex w-full items-start gap-3 rounded-2xl border border-terracotta/10 bg-white p-3.5 text-start shadow-sm transition hover:border-terracotta/30"
    >
      <span className="text-3xl" aria-hidden>
        {entry.e}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-ink">{entry.t}</div>
        <div className="mt-0.5 text-xs text-muted">{t('story.minutes', { n: entry.m })}</div>
        {used?.length || missing?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(used ?? []).slice(0, 5).map((u) => (
              <span key={`u-${u}`} className="rounded-full bg-sage/15 px-2 py-0.5 text-xs text-have">
                ✓ {u}
              </span>
            ))}
            {(missing ?? []).slice(0, 3).map((m) => (
              <span key={`m-${m}`} className="rounded-full bg-missing/10 px-2 py-0.5 text-xs text-missing">
                + {m}
              </span>
            ))}
          </div>
        ) : entry.ds ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{entry.ds}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-chip border-t-terracotta" />
    </div>
  )
}
