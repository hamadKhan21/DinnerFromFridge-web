import { Link } from 'react-router-dom'
import { DietChips } from '../components/DietChips'
import { InstallBanner } from '../components/InstallBanner'
import { SnapButton } from '../components/SnapButton'
import { StreakCard } from '../components/StreakCard'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  usePageSeo,
} from '../lib/documentMeta'
import { COOK_TIME_LANDINGS, CUISINE_LANDINGS } from '../lib/seoLandings'
import { HUBS } from '../lib/hubs'

export function HomePage() {
  const {
    quotaRemaining,
    shopping,
    favorites,
    dietaryPreferences,
    setDietaryPreferences,
    nutritionTargets,
    todayTotals,
    caloriesRemaining,
    todayLog,
  } = useApp()
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

      <section className="rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark px-5 pb-5 pt-6 text-white shadow-lg">
        <h1 className="whitespace-pre-line text-3xl font-extrabold leading-tight">{t('home.whatsForDinner')}</h1>
        <p className="mt-2 text-white/90">{t('hero.subtitle')}</p>
        <div className="mt-5">
          <SnapButton label={t('hero.snap')} hint={t('hero.snapHint')} />
        </div>
        <Link
          to="/sample-fridge"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/10 px-4 py-3 font-bold text-white backdrop-blur"
        >
          ✨ {t('hero.trySample')}
        </Link>
        <div className="mt-3 flex items-center justify-between text-sm text-white/85">
          <Link to="/ingredients" className="font-semibold underline underline-offset-2">
            ✏️ {t('hero.typeInstead')}
          </Link>
          <span>
            {quotaRemaining < 3
              ? quotaRemaining === 1
                ? t('home.oneFreeLeft')
                : t('home.freeLeft', { n: quotaRemaining })
              : t('hero.freeScans')}
          </span>
        </div>
      </section>

      <InstallBanner />

      <Link
        to="/today"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-terracotta/20 bg-white px-4 py-3.5 shadow-sm"
      >
        <span className="text-2xl" aria-hidden>
          🔥
        </span>
        <div className="min-w-0 flex-1">
          {nutritionTargets ? (
            <>
              <div className="font-bold text-ink">
                {t('home.todayCal', {
                  eaten: Math.round(todayTotals.calories),
                  target: Math.round(nutritionTargets.calorieTarget),
                })}
              </div>
              <div className="text-sm text-muted">
                {caloriesRemaining != null && caloriesRemaining >= 0
                  ? t('home.todayRemaining', { n: caloriesRemaining })
                  : caloriesRemaining != null
                    ? t('home.todayOver', { n: Math.abs(caloriesRemaining) })
                    : t('home.todayTrack')}
              </div>
            </>
          ) : todayLog.entries.length ? (
            <>
              <div className="font-bold text-ink">
                {t('home.todayEaten', { n: Math.round(todayTotals.calories) })}
              </div>
              <div className="text-sm text-muted">{t('home.todaySetGoal')}</div>
            </>
          ) : (
            <>
              <div className="font-bold text-ink">{t('home.todayTrack')}</div>
              <div className="text-sm text-muted">{t('home.todayTrackHint')}</div>
            </>
          )}
        </div>
        <span className="text-muted" aria-hidden>
          ›
        </span>
      </Link>

      <StreakCard />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/leftover-rescue" className="rounded-2xl border border-sage/40 bg-white p-4 shadow-sm">
          <div className="text-2xl" aria-hidden>
            🥡
          </div>
          <div className="mt-1 font-bold text-ink">{t('leftovers.homeTile')}</div>
          <div className="text-xs text-muted">{t('leftovers.homeTileHint')}</div>
        </Link>
        <Link to="/challenge" className="rounded-2xl border border-terracotta/30 bg-white p-4 shadow-sm">
          <div className="text-2xl" aria-hidden>
            🧑‍🍳
          </div>
          <div className="mt-1 font-bold text-ink">{t('challenge.title')}</div>
          <div className="text-xs text-muted">{t('challenge.homeTileHint')}</div>
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('hub.collections')}</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {HUBS.map((h) => (
            <Link
              key={h.slug}
              to={`/${h.slug}`}
              className="flex items-center gap-2 rounded-2xl bg-chip/70 px-3 py-3 text-sm font-bold text-ink hover:bg-terracotta/15"
            >
              <span className="text-xl" aria-hidden>
                {h.emoji}
              </span>
              {t(`hub.name.${h.slug}`)}
            </Link>
          ))}
        </div>
      </section>

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
