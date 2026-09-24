import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nContext'
import { usePageSeo } from '../lib/documentMeta'

export function PaywallPage() {
  const navigate = useNavigate()
  const { quotaRemaining } = useApp()
  const { t } = useI18n()

  usePageSeo({
    title: 'Pro | Dinner From Fridge',
    description: 'Unlock more AI fridge scans and recipe lookups with Dinner From Fridge Pro.',
    canonical: '/paywall',
    noIndex: true,
  })

  return (
    <div>
      <PageHeader title={t('paywall.title')} back />
      <div className="px-6 py-6">
        <div className="text-5xl">✨</div>
        <h2 className="mt-3 text-2xl font-bold">{t('paywall.heading')}</h2>
        <p className="mt-2 text-muted">
          {t('paywall.body', { n: 3, remaining: quotaRemaining })}
        </p>
        <p className="mt-2 text-sm text-muted">{t('paywall.webNote')}</p>

        <div className="mt-6 rounded-2xl border border-terracotta/15 bg-white p-5">
          <h3 className="text-lg font-extrabold text-terracotta">{t('paywall.pro')}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>{t('paywall.feature1')}</li>
            <li>{t('paywall.feature2')}</li>
            <li>{t('paywall.feature3')}</li>
          </ul>
          <button
            type="button"
            className="mt-4 w-full rounded-2xl bg-terracotta py-3 font-semibold text-white"
            onClick={() => alert(t('paywall.billingStub'))}
          >
            {t('paywall.unlock')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ingredients')}
          className="mt-6 w-full text-center font-semibold text-terracotta"
        >
          {t('paywall.keepManual')}
        </button>
      </div>
    </div>
  )
}
