import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import type { Locale } from '../i18n/translations'
import { usePageSeo } from '../lib/documentMeta'

const PREF_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'halal',
  'keto',
  'high-protein',
] as const

export function SettingsPage() {
  const {
    quotaRemaining,
    quotaUsed,
    quotaLimit,
    refreshQuota,
    dietaryPreferences,
    setDietaryPreferences,
  } = useApp()
  const { t, locale, setLocale, locales } = useI18n()
  usePageSeo({
    title: 'Settings | Dinner From Fridge',
    description: 'AI quota, dietary preferences, language, and legal links for Dinner From Fridge.',
    canonical: '/settings',
  })


  const togglePref = (p: string) => {
    setDietaryPreferences(
      dietaryPreferences.includes(p)
        ? dietaryPreferences.filter((x) => x !== p)
        : [...dietaryPreferences, p],
    )
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} back />
      <div className="space-y-6 px-5 py-5">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('settings.aiQuota')}
          </h2>
          <p className="mt-2 text-sm">
            {t('settings.quotaUsed', {
              used: quotaUsed,
              limit: quotaLimit,
              remaining: quotaRemaining,
            })}
          </p>
          <p className="mt-1 text-xs text-muted">{t('settings.quotaHint')}</p>
          <button
            type="button"
            onClick={() => void refreshQuota()}
            className="mt-2 text-sm font-semibold text-terracotta"
          >
            {t('settings.refreshQuota')}
          </button>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('settings.language')}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {locales.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLocale(opt.code as Locale)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  locale === opt.code
                    ? 'bg-terracotta/20 text-terracotta-dark'
                    : 'bg-chip text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('settings.dietary')}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {PREF_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePref(p)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  dietaryPreferences.includes(p)
                    ? 'bg-terracotta/20 text-terracotta-dark'
                    : 'bg-chip text-ink'
                }`}
              >
                {t(`pref.${p}`)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('settings.about')}
          </h2>
          <p className="mt-2 text-sm">
            <strong>{t('common.appName')}</strong>
          </p>
          <p className="mt-1 text-xs text-muted">{t('settings.version', { version: '1.0.0' })}</p>
          <Link to="/about" className="mt-2 inline-block text-sm font-semibold text-terracotta">
            About Dinner From Fridge →
          </Link>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            {t('settings.privacyTerms')}
          </h2>
          <div className="mt-2 space-y-1">
            <Link to="/legal/privacy" className="block text-terracotta underline">
              {t('settings.privacyPolicy')}
            </Link>
            <Link to="/legal/terms" className="block text-terracotta underline">
              {t('settings.termsOfUse')}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">{t('settings.privacyNote')}</p>
        </section>
      </div>
    </div>
  )
}
