import { Link } from 'react-router-dom'
import { DietChips } from '../components/DietChips'
import { InstallBanner } from '../components/InstallBanner'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  usePageSeo,
} from '../lib/documentMeta'
import { COOK_TIME_LANDINGS, CUISINE_LANDINGS } from '../lib/seoLandings'

export function HomePage() {
  const { quotaRemaining, shopping, favorites, dietaryPreferences, setDietaryPreferences } = useApp()
  const { t } = useI18n()
  const unchecked = shopping.filter((s) => !s.checked).length

  usePageSeo(
    {
      title: 'Dinner From Fridge — cook tonight from what you already have',
      description:
        'Scan your fridge or type ingredients. Match leftovers to world recipes, cook in 15–45 minutes, track nutrition, and plan the week. No pork.',
      canonical: '/',
      keywords: 'fridge recipes, leftover dinner, what to cook tonight, 30 minute meals',
    },
    [
      { id: 'website', data: buildWebsiteJsonLd() },
      { id: 'organization', data: buildOrganizationJsonLd() },
    ],
  )

  return (
    <div className="px-6 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">🍽️</span>
        <span className="font-extrabold text-terracotta">{t('common.appName')}</span>
        <div className="ms-auto flex gap-1">
          <Link to="/settings" className="rounded-lg p-2 text-ink hover:bg-chip" title={t('home.settings')}>
            ⚙️
          </Link>
          <Link to="/shopping" className="relative rounded-lg p-2 text-ink hover:bg-chip" title={t('home.shopping')}>
            🛒
            {unchecked > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-white">
                {unchecked}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <h1 className="whitespace-pre-line text-3xl font-extrabold leading-tight text-ink">
        {t('home.whatsForDinner')}
      </h1>
      <p className="mt-2 text-muted">{t('home.subtitle')}</p>

      <InstallBanner />

      <div className="mt-8 space-y-3">
        <Link
          to="/capture"
          className="flex items-center gap-4 rounded-2xl bg-terracotta px-5 py-4 text-white shadow-sm"
        >
          <span className="text-3xl">📸</span>
          <div>
            <div className="font-bold">{t('home.scanFridge')}</div>
            <div className="text-sm text-white/80">{t('home.scanHint')}</div>
          </div>
        </Link>
        <Link
          to="/ingredients"
          className="flex items-center gap-4 rounded-2xl border border-terracotta bg-white px-5 py-4 text-terracotta-dark"
        >
          <span className="text-3xl">✏️</span>
          <div>
            <div className="font-bold">{t('home.enterManually')}</div>
            <div className="text-sm text-muted">{t('home.enterHint')}</div>
          </div>
        </Link>
      </div>

      {quotaRemaining < 3 ? (
        <p className="mt-3 text-sm text-muted">
          {quotaRemaining === 1
            ? t('home.oneFreeLeft')
            : t('home.freeLeft', { n: quotaRemaining })}
        </p>
      ) : null}

      <section className="mt-6">
        <p className="mb-2 text-sm font-semibold text-muted">Diet preferences</p>
        <DietChips selected={dietaryPreferences} onChange={setDietaryPreferences} compact />
      </section>

      <Link
        to="/recipes"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-terracotta px-4 py-3 font-semibold text-terracotta-dark"
      >
        📖 {t('home.browseRecipes')}
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/favorites"
          className="flex items-center justify-center gap-2 rounded-2xl border border-terracotta/30 bg-white px-3 py-3 text-sm font-semibold text-ink"
        >
          ❤️ {t('home.favorites')}
          {favorites.length ? ` (${favorites.length})` : ''}
        </Link>
        <Link
          to="/week-plan"
          className="flex items-center justify-center gap-2 rounded-2xl border border-terracotta/30 bg-white px-3 py-3 text-sm font-semibold text-ink"
        >
          📅 {t('home.weekPlan')}
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Browse by time</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {COOK_TIME_LANDINGS.map((c) => (
            <Link
              key={c.slug}
              to={`/cook/${c.slug}`}
              className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink hover:bg-terracotta/15"
            >
              ≤{c.maxMinutes} min
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Browse by cuisine</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CUISINE_LANDINGS.map((c) => (
            <Link
              key={c.slug}
              to={`/cuisine/${c.slug}`}
              className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink hover:bg-terracotta/15"
            >
              {c.label.split(' / ')[0]}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
