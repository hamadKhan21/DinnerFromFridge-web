import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CatalogCard, Spinner } from '../components/CatalogCard'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { useCatalog } from '../lib/catalog'
import { matchCatalog, parseChallengeParam, smallRecipes } from '../lib/catalogMatch'
import { buildItemListJsonLd, usePageSeo } from '../lib/documentMeta'
import { formatMoney, loadSavingsSettings } from '../lib/streaks'

const QUICK_ADD = ['eggs', 'rice', 'potato', 'chicken', 'bread', 'pasta', 'tomato', 'chickpeas', 'lentils', 'cheese', 'yogurt', 'spinach', 'tuna', 'noodles']

export function LeftoversPage() {
  const { t } = useI18n()
  const { ingredients } = useApp()
  const { catalog, loading } = useCatalog()
  const [params] = useSearchParams()
  // /leftover-rescue?i=eggs,rice,bell+pepper (shared from the mobile app) pre-fills the list
  const [have, setHave] = useState<string[]>(() => {
    const fromUrl = parseChallengeParam(params.get('i'), 15).map((x) => x.toLowerCase())
    return fromUrl.length ? fromUrl : ingredients.map((i) => i.name.toLowerCase()).slice(0, 12)
  })
  const [draft, setDraft] = useState('')
  const [maxCore, setMaxCore] = useState(3)
  const savings = loadSavingsSettings()

  const browse = useMemo(() => smallRecipes(catalog, maxCore, 24), [catalog, maxCore])
  const matches = useMemo(() => (have.length ? matchCatalog(catalog, have, { maxCore, limit: 40 }) : []), [catalog, have, maxCore])
  const ready = matches.filter((m) => m.missingCore.length === 0).slice(0, 12)
  const oneMore = matches.filter((m) => m.missingCore.length === 1).slice(0, 12)

  usePageSeo(
    {
      title: 'Leftover rescue: 2–4 ingredient dinners — cook before you shop | Dinner From Fridge',
      description:
        'Empty fridge? Find dinners that need only 2–4 main ingredients (salt, oil and spices assumed). Cook before you shop and save money.',
      canonical: '/leftover-rescue',
      keywords: 'leftover recipes, few ingredient dinners, empty fridge meals, 3 ingredient dinner, cook before you shop, save money on food',
      image: '/og/leftovers.jpg',
    },
    browse.length
      ? [
          {
            id: 'collection',
            data: buildItemListJsonLd(
              'Leftover rescue — dinners with 2–4 ingredients',
              'Dinners that need only a few main ingredients.',
              '/leftover-rescue',
              browse.map((e) => ({ id: e.id, title: e.t })),
            ),
          },
        ]
      : undefined,
  )

  const add = (name: string) => {
    const n = name.trim().toLowerCase().slice(0, 32)
    if (!n || have.includes(n)) return
    setHave((h) => [...h, n].slice(0, 15))
  }

  return (
    <div>
      <PageHeader title={t('leftovers.title')} back />
      <div className="px-5 py-5">
        <div className="rounded-3xl bg-gradient-to-br from-sage to-have p-5 text-white shadow">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">🥡 {t('leftovers.kicker')}</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug">{t('leftovers.heading')}</h1>
          <p className="mt-2 text-sm text-white/90">{t('leftovers.intro')}</p>
          <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            {t('leftovers.saveHint', { amount: formatMoney(savings.perMeal, savings.currency) })}
          </p>
        </div>

        <h2 className="mt-5 font-bold text-ink">{t('leftovers.haveHeading')}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {have.map((h) => (
            <button key={h} type="button" onClick={() => setHave((x) => x.filter((y) => y !== h))} className="rounded-full bg-sage/20 px-3 py-1.5 text-sm font-semibold text-have">
              {h} ✕
            </button>
          ))}
          {!have.length ? <span className="text-sm text-muted">{t('leftovers.haveEmpty')}</span> : null}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add(draft)
            setDraft('')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('leftovers.addPlaceholder')}
            className="min-w-0 flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2.5 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 font-semibold text-white">
            {t('challenge.add')}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ADD.filter((q) => !have.includes(q)).map((q) => (
            <button key={q} type="button" onClick={() => add(q)} className="rounded-full bg-chip px-3 py-1 text-sm text-ink">
              + {q}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="text-sm font-semibold text-muted">{t('leftovers.maxLabel')}</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxCore(n)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${maxCore === n ? 'bg-terracotta text-white' : 'bg-chip text-ink'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{t('leftovers.staplesNote')}</p>

        {loading ? (
          <Spinner />
        ) : have.length ? (
          <>
            <h2 className="mt-6 text-lg font-extrabold text-ink">✅ {t('leftovers.readyHeading', { n: ready.length })}</h2>
            <div className="mt-2 space-y-2">
              {ready.map((m) => (
                <CatalogCard key={m.entry.id} entry={m.entry} used={m.used} />
              ))}
              {!ready.length ? <p className="text-sm text-muted">{t('leftovers.readyNone')}</p> : null}
            </div>
            {oneMore.length ? (
              <>
                <h2 className="mt-6 text-lg font-extrabold text-ink">🛒 {t('leftovers.oneMoreHeading')}</h2>
                <div className="mt-2 space-y-2">
                  {oneMore.map((m) => (
                    <CatalogCard key={m.entry.id} entry={m.entry} used={m.used} missing={m.missingCore} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="mt-6 text-lg font-extrabold text-ink">{t('leftovers.browseHeading', { n: maxCore })}</h2>
            <div className="mt-2 space-y-2">
              {browse.map((e) => (
                <CatalogCard key={e.id} entry={e} />
              ))}
            </div>
          </>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link to="/capture" className="rounded-2xl bg-terracotta py-3 text-center font-bold text-white">
            📸 {t('hero.snap')}
          </Link>
          <Link to="/challenge" className="rounded-2xl border border-terracotta py-3 text-center font-bold text-terracotta-dark">
            🧑‍🍳 {t('challenge.title')}
          </Link>
        </div>
      </div>
    </div>
  )
}
