import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { COOK_TIME_LANDINGS, CUISINE_LANDINGS } from '../lib/seoLandings'
import { usePageSeo } from '../lib/documentMeta'

export function AboutPage() {
  usePageSeo({
    title: 'About Dinner From Fridge — fridge-to-dinner recipes',
    description:
      'Dinner From Fridge helps home cooks turn leftovers and fridge ingredients into dinner ideas, cook steps, nutrition info, and week plans. No pork in the catalog.',
    canonical: '/about',
    keywords: 'about dinner from fridge, fridge to dinner, leftover recipes app',
  })

  return (
    <div>
      <PageHeader title="About" back />
      <article className="space-y-5 px-5 py-5 text-sm leading-relaxed text-ink">
        <h1 className="text-2xl font-extrabold text-ink">About Dinner From Fridge</h1>
        <p>
          Dinner From Fridge helps you cook tonight from what you already have — leftovers, a half-empty
          fridge, or a short pantry list. Scan ingredients or type them in, then match to a world recipe
          catalog with cook steps, scaled quantities, and optional nutrition.
        </p>

        <section>
          <h2 className="text-base font-bold text-ink">Who it&apos;s for</h2>
          <p className="mt-1 text-muted">
            Busy home cooks who want fast dinners (15–45 minutes), cuisine variety, and less food waste —
            without another full grocery run.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Key features</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
            <li>
              <Link className="font-semibold text-terracotta" to="/capture">
                Fridge scan
              </Link>{' '}
              — photo your fridge or pantry for ingredient suggestions.
            </li>
            <li>
              <Link className="font-semibold text-terracotta" to="/ingredients">
                Manual ingredients
              </Link>{' '}
              — type what you have and get dinner matches.
            </li>
            <li>
              <Link className="font-semibold text-terracotta" to="/recipes">
                World recipes
              </Link>{' '}
              — browse and search the catalog.
            </li>
            <li>Cook mode with step-by-step instructions.</li>
            <li>
              <Link className="font-semibold text-terracotta" to="/nutrition">
                Nutrition
              </Link>{' '}
              calculator and{' '}
              <Link className="font-semibold text-terracotta" to="/goals">
                goals
              </Link>
              .
            </li>
            <li>
              <Link className="font-semibold text-terracotta" to="/today">
                Today
              </Link>{' '}
              — optional on-device calorie tracking (foods, recipes, custom entries).
            </li>
            <li>Week plan, favorites, and shopping list.</li>
            <li>
              <strong className="text-ink">No pork</strong> — the catalog excludes pork products.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink">Cook by time</h2>
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

        <section>
          <h2 className="text-base font-bold text-ink">Browse by cuisine</h2>
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

        <p className="text-muted">
          Canonical site:{' '}
          <a className="text-terracotta underline" href="https://dinnerfromfridge.com">
            dinnerfromfridge.com
          </a>
        </p>
      </article>
    </div>
  )
}
