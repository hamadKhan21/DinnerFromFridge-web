import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CatalogCard, Spinner } from '../components/CatalogCard'
import { PageHeader } from '../components/PageHeader'
import { ShareSheet } from '../components/ShareSheet'
import { SnapButton } from '../components/SnapButton'
import { useI18n } from '../i18n/I18nContext'
import { useCatalog } from '../lib/catalog'
import {
  CHALLENGE_MAX,
  CHALLENGE_MIN,
  challengeQuery,
  joinList,
  matchCatalog,
  parseChallengeParam,
} from '../lib/catalogMatch'
import { usePageSeo } from '../lib/documentMeta'
import { renderChallengeStory } from '../lib/storyCard'

const IDEAS = ['eggs', 'rice', 'chicken', 'spinach', 'potato', 'tomato', 'chickpeas', 'yogurt', 'paneer', 'pasta', 'cheese', 'lentils', 'bread', 'tuna', 'tofu', 'beef', 'mushroom', 'carrot']

export function ChallengePage() {
  const [params] = useSearchParams()
  const items = useMemo(() => parseChallengeParam(params.get('i')), [params])
  return items.length >= CHALLENGE_MIN ? <ChallengeView items={items} /> : <ChallengeCreator initial={items} />
}

function useChallengeText(items: string[]) {
  const { t } = useI18n()
  const list = joinList(items, t('common.and'))
  return { list, headline: t('challenge.headline', { list }) }
}

function ChallengeCreator({ initial }: { initial: string[] }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<string[]>(initial)
  const [draft, setDraft] = useState('')
  const { catalog } = useCatalog()
  const count = useMemo(
    () => (picked.length >= CHALLENGE_MIN ? matchCatalog(catalog, picked, { minUsed: Math.min(2, picked.length), limit: 99 }).length : 0),
    [catalog, picked],
  )

  usePageSeo({
    title: 'Fridge challenge — can you make dinner from these? | Dinner From Fridge',
    description: 'Pick 2–5 ingredients and challenge a friend to make dinner from them. See matching recipes instantly.',
    canonical: '/challenge',
    image: '/og/challenge.jpg',
  })

  const toggle = (name: string) => {
    const n = name.trim().toLowerCase()
    if (!n) return
    setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= CHALLENGE_MAX ? p : [...p, n]))
  }

  return (
    <div>
      <PageHeader title={t('challenge.title')} back />
      <div className="px-5 py-5">
        <h1 className="text-2xl font-extrabold text-ink">{t('challenge.createHeading')}</h1>
        <p className="mt-1 text-sm text-muted">{t('challenge.createHint', { min: CHALLENGE_MIN, max: CHALLENGE_MAX })}</p>

        <div className="mt-4 flex min-h-12 flex-wrap gap-2 rounded-2xl border border-dashed border-terracotta/40 bg-white p-3">
          {picked.length ? (
            picked.map((p) => (
              <button key={p} type="button" onClick={() => toggle(p)} className="rounded-full bg-terracotta px-3 py-1.5 text-sm font-bold text-white">
                {p} ✕
              </button>
            ))
          ) : (
            <span className="text-sm text-muted">{t('challenge.emptyPick')}</span>
          )}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            toggle(draft)
            setDraft('')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={32}
            placeholder={t('challenge.addPlaceholder')}
            className="min-w-0 flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2.5 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-chip px-4 font-semibold text-terracotta-dark">
            {t('challenge.add')}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {IDEAS.filter((i) => !picked.includes(i)).map((i) => (
            <button key={i} type="button" onClick={() => toggle(i)} disabled={picked.length >= CHALLENGE_MAX} className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40">
              + {i}
            </button>
          ))}
        </div>

        {picked.length >= CHALLENGE_MIN ? (
          <p className="mt-4 text-sm font-semibold text-have">{t('challenge.matchCount', { n: count })}</p>
        ) : null}

        <button
          type="button"
          disabled={picked.length < CHALLENGE_MIN}
          onClick={() => navigate(`/challenge?i=${challengeQuery(picked)}&new=1`)}
          className="mt-5 w-full rounded-2xl bg-terracotta py-4 text-lg font-extrabold text-white shadow disabled:opacity-40"
        >
          {t('challenge.create')}
        </button>
      </div>
    </div>
  )
}

function ChallengeView({ items }: { items: string[] }) {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [shareOpen, setShareOpen] = useState(params.get('new') === '1')
  const { catalog, loading } = useCatalog()
  const { list, headline } = useChallengeText(items)
  const matches = useMemo(
    () => matchCatalog(catalog, items, { minUsed: Math.min(2, items.length), limit: 12 }),
    [catalog, items],
  )
  const path = `/challenge?i=${challengeQuery(items)}`
  const url = `${window.location.origin}${path}`

  usePageSeo({
    title: `Can you make dinner from ${joinList(items)}? | Dinner From Fridge`,
    description: `A fridge challenge: dinner from ${joinList(items)}. See recipes that use them and accept the challenge.`,
    canonical: path,
    image: '/og/challenge.jpg',
    noIndex: true,
  })

  return (
    <div>
      <PageHeader title={t('challenge.title')} back />
      <div className="px-5 py-5">
        <div className="rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark p-5 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wide text-white/80">🧑‍🍳 {t('challenge.kicker')}</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug">{headline}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((i) => (
              <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                {i}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!matches.length}
              onClick={() => matches[0] && navigate(`/recipe/${encodeURIComponent(matches[0].entry.id)}`)}
              className="rounded-2xl bg-white py-3 font-extrabold text-terracotta-dark disabled:opacity-60"
            >
              ✅ {t('challenge.accept')}
            </button>
            <button type="button" onClick={() => setShareOpen(true)} className="rounded-2xl border border-white/70 py-3 font-bold text-white">
              📤 {t('challenge.share')}
            </button>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-extrabold text-ink">{t('challenge.recipesHeading', { n: matches.length })}</h2>
        <p className="text-sm text-muted">{t('challenge.recipesHint')}</p>
        {loading ? (
          <Spinner />
        ) : (
          <div className="mt-3 space-y-2">
            {matches.map((m) => (
              <CatalogCard key={m.entry.id} entry={m.entry} used={m.used} missing={m.missingCore} />
            ))}
            {!matches.length ? <p className="py-6 text-center text-muted">{t('challenge.none')}</p> : null}
          </div>
        )}

        <div className="mt-6 space-y-3 rounded-3xl border border-terracotta/20 bg-white p-4">
          <p className="font-bold text-ink">{t('challenge.makeOwnTitle')}</p>
          <SnapButton
            label={t('hero.snap')}
            hint={t('hero.snapHint')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-terracotta px-5 py-3.5 font-extrabold text-white"
          />
          <Link to="/challenge" className="block rounded-2xl border border-terracotta py-3 text-center font-bold text-terracotta-dark">
            🧑‍🍳 {t('challenge.makeOwn')}
          </Link>
        </div>
      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={t('challenge.share')}
        url={url}
        text={t('challenge.shareText', { list })}
        fileName="fridge-challenge.jpg"
        renderKey={`${items.join(',')}-${dir}-${matches.length}`}
        makeImage={() =>
          renderChallengeStory({
            items,
            headline,
            sub: t('challenge.storySub', { n: matches.length || 3 }),
            cta: t('challenge.storyCta'),
            dir,
          })
        }
      />
    </div>
  )
}
