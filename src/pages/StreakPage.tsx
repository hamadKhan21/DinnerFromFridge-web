import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ShareSheet } from '../components/ShareSheet'
import { useI18n } from '../i18n/I18nContext'
import { usePageSeo } from '../lib/documentMeta'
import { renderBadgeStory } from '../lib/storyCard'
import { formatMoney, recordCooked, saveSavingsSettings, useStreakStats } from '../lib/streaks'

const CURRENCIES = ['$', '€', '£', 'PKR', 'AED', 'SAR', '₹', '₺']

export function StreakPage() {
  const { t, dir, locale } = useI18n()
  const s = useStreakStats()
  const [params] = useSearchParams()
  const justCooked = params.get('cooked') === '1'
  const [shareOpen, setShareOpen] = useState(false)
  const [perMeal, setPerMeal] = useState(String(s.settings.perMeal))
  const [currency, setCurrency] = useState(s.settings.currency)
  const [added, setAdded] = useState(false)

  usePageSeo({
    title: 'Home-cooked streak & money saved | Dinner From Fridge',
    description: 'Track home-cooked dinners, keep a weekly streak and see an estimate of money saved versus takeout.',
    canonical: '/streak',
    image: '/og/streak.jpg',
  })

  const saved = formatMoney(s.saved, s.settings.currency)
  const dayLetter = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y!, m! - 1, d!).toLocaleDateString(locale, { weekday: 'narrow' })
  }

  return (
    <div>
      <PageHeader title={t('streak.title')} back />
      <div className="px-5 py-5">
        {justCooked ? (
          <div className="mb-4 rounded-2xl bg-sage/15 px-4 py-3 text-sm font-bold text-have">🎉 {t('streak.justCooked', { n: s.total })}</div>
        ) : null}

        <div className="rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark p-5 text-center text-white shadow-lg">
          <div className="text-5xl" aria-hidden>
            🔥
          </div>
          <div className="mt-1 text-5xl font-black">{s.weekStreak}</div>
          <div className="text-sm font-bold uppercase tracking-wide text-white/85">{t('streak.weekStreakLabel')}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat value={String(s.thisWeek)} label={t('streak.thisWeekLabel')} />
            <Stat value={String(s.total)} label={t('streak.totalLabel')} />
            <Stat value={saved} label={t('streak.savedLabel')} />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {s.last7.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${d.count ? 'bg-white text-terracotta-dark' : 'bg-white/15 text-white/60'}`}>
                  {d.count ? '✓' : ''}
                </span>
                <span className="text-[10px] font-semibold text-white/75">{dayLetter(d.date)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t('streak.estimateNote', { amount: formatMoney(s.settings.perMeal, s.settings.currency) })}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setShareOpen(true)} disabled={!s.total} className="rounded-2xl bg-terracotta py-3.5 font-bold text-white shadow disabled:opacity-40">
            📤 {t('streak.shareBadge')}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdded(recordCooked({ title: 'Home-cooked dinner' }))
              window.setTimeout(() => setAdded(false), 2500)
            }}
            className="rounded-2xl border border-terracotta py-3.5 font-bold text-terracotta-dark"
          >
            🍳 {t('streak.addManual')}
          </button>
        </div>
        {added ? <p className="mt-2 text-center text-sm font-semibold text-have">{t('streak.counted')}</p> : null}

        <p className="mt-4 text-sm text-muted">{t('streak.howItWorks')}</p>

        <details className="mt-4 rounded-2xl border border-terracotta/15 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-ink">{t('streak.settings')}</summary>
          <label className="mt-3 block text-sm font-medium text-muted">{t('streak.perMealLabel')}</label>
          <div className="mt-1 flex gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-xl border border-terracotta/20 bg-white px-2 py-2">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              inputMode="decimal"
              value={perMeal}
              onChange={(e) => setPerMeal(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
              className="w-28 rounded-xl border border-terracotta/20 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                const n = Number(perMeal)
                saveSavingsSettings({ perMeal: Number.isFinite(n) && n >= 0 ? n : 12, currency })
              }}
              className="rounded-xl bg-chip px-4 font-semibold text-terracotta-dark"
            >
              {t('streak.save')}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t('streak.perMealHint')}</p>
        </details>

        <Link to="/recipes" className="mt-6 block text-center font-semibold text-terracotta">
          {t('streak.findNext')} →
        </Link>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={t('streak.shareBadge')}
        url={`${window.location.origin}/streak`}
        text={t('streak.shareText', { n: s.total, amount: saved })}
        fileName="home-cooked-streak.jpg"
        renderKey={`${s.total}-${s.weekStreak}-${saved}-${dir}`}
        makeImage={() =>
          renderBadgeStory({
            bigNumber: String(Math.max(s.weekStreak, 1)),
            bigLabel: t('streak.weekStreakLabel'),
            lines: [t('streak.badgeLine1', { n: s.total }), t('streak.badgeLine2', { amount: saved })],
            footnote: t('streak.badgeFootnote'),
            cta: t('streak.badgeCta'),
            dir,
          })
        }
      />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-2">
      <div className="truncate text-lg font-extrabold">{value}</div>
      <div className="text-[11px] font-semibold text-white/80">{label}</div>
    </div>
  )
}
