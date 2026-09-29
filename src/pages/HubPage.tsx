import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CatalogCard, Spinner } from '../components/CatalogCard'
import { PageHeader } from '../components/PageHeader'
import { SnapButton } from '../components/SnapButton'
import { useI18n } from '../i18n/I18nContext'
import { useCatalog } from '../lib/catalog'
import { buildItemListJsonLd, usePageSeo } from '../lib/documentMeta'
import { curateHub, hubBySlug, hubCopy, HUBS, type HubDef } from '../lib/hubs'

export function HubPage({ slug }: { slug: HubDef['slug'] }) {
  const hub = hubBySlug(slug)!
  const { t, locale } = useI18n()
  const copy = hubCopy(hub, locale)
  const en = hub.copy.en
  const { catalog, loading } = useCatalog()
  const sections = useMemo(() => (catalog.length ? curateHub(hub, catalog) : {}), [hub, catalog])
  const all = Object.values(sections).flat()

  usePageSeo(
    {
      title: `${locale === 'en' ? en.title : copy.title} | Dinner From Fridge`,
      description: en.intro,
      canonical: `/${hub.slug}`,
      keywords: hub.keywords,
      image: `/og/${hub.slug}.jpg`,
    },
    all.length
      ? [
          {
            id: 'collection',
            data: buildItemListJsonLd(en.h1, en.intro, `/${hub.slug}`, all.map((e) => ({ id: e.id, title: e.t }))),
          },
        ]
      : undefined,
  )

  return (
    <div>
      <PageHeader title={copy.h1} back />
      <div className="px-5 py-5">
        <div className="rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark p-5 text-white shadow-lg">
          <div className="text-4xl" aria-hidden>
            {hub.emoji}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold leading-snug">{copy.h1}</h1>
          <p className="mt-2 text-sm text-white/90">{copy.intro}</p>
          <div className="mt-4">
            <SnapButton label={t('hero.snap')} hint={t('hub.snapHint')} />
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label={t('hub.collections')}>
          {HUBS.map((h) => (
            <Link
              key={h.slug}
              to={`/${h.slug}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${h.slug === hub.slug ? 'bg-terracotta text-white' : 'bg-chip text-ink'}`}
            >
              {h.emoji} {t(`hub.name.${h.slug}`)}
            </Link>
          ))}
        </nav>

        {loading ? (
          <Spinner />
        ) : (
          hub.sections.map((s) => (
            <section key={s.key} className="mt-6">
              <h2 className="text-lg font-extrabold text-ink">{copy.sections[s.key]?.h}</h2>
              <p className="text-sm text-muted">{copy.sections[s.key]?.p}</p>
              <div className="mt-3 space-y-2">
                {(sections[s.key] ?? []).map((e) => (
                  <CatalogCard key={e.id} entry={e} />
                ))}
              </div>
            </section>
          ))
        )}

        <section className="mt-6 rounded-3xl border border-terracotta/20 bg-white p-4">
          <h2 className="font-extrabold text-ink">💡 {t('hub.tips')}</h2>
          <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-ink">
            {copy.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to="/leftover-rescue" className="rounded-2xl border border-terracotta py-3 text-center text-sm font-bold text-terracotta-dark">
            🥡 {t('leftovers.title')}
          </Link>
          <Link to="/challenge" className="rounded-2xl border border-terracotta py-3 text-center text-sm font-bold text-terracotta-dark">
            🧑‍🍳 {t('challenge.title')}
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted">{t('hub.halalNote')}</p>
      </div>
    </div>
  )
}
