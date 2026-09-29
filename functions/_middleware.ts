import {
  challengeQuery,
  coreIngredients,
  joinList,
  matchCatalog,
  parseChallengeParam,
  smallRecipes,
  type CatalogEntry,
} from '../src/lib/catalogMatch'
import { curateHub, hubBySlug, HUBS } from '../src/lib/hubs'

/**
 * Cloudflare Pages middleware: serve contentful HTML to known crawlers
 * so Google / AI bots that do not execute JS still see titles, meta, JSON-LD, and body text.
 * Normal browsers pass through to the SPA.
 */

const API_BASE = 'https://tonightfromthis.hamad2k9.workers.dev'
const SITE = 'https://dinnerfromfridge.com'
const LOGO = `${SITE}/app-icon.png`
const OG_IMAGE = `${SITE}/og/default.jpg`
const og = (slug: string) => `${SITE}/og/${slug}.jpg`

const BOT_RE =
  /Googlebot|Google-Extended|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|Yandex|Slurp|Applebot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|Claude-Web|PerplexityBot|Bytespider|CCBot|Amazonbot|meta-externalagent|ia_archiver|SemrushBot|AhrefsBot|DotBot|PetalBot|cohere-ai/i

const COOK_LANDINGS: Record<string, { label: string; maxMinutes: number; intro: string }> = {
  '15-min': {
    label: '15-minute dinners',
    maxMinutes: 15,
    intro: 'Fast dinners you can cook in about 15 minutes or less — perfect for busy weeknights.',
  },
  '20-min': {
    label: '20-minute dinners',
    maxMinutes: 20,
    intro: 'Quick meals ready in about 20 minutes. Great when you want dinner without the wait.',
  },
  '30-min': {
    label: '30-minute dinners',
    maxMinutes: 30,
    intro: 'Weeknight-friendly recipes ready in about 30 minutes from prep to plate.',
  },
  '45-min': {
    label: '45-minute dinners',
    maxMinutes: 45,
    intro: 'Heartier dinners that still fit a busy evening — about 45 minutes or less.',
  },
}

const CUISINE_LANDINGS: Record<string, { label: string; keywords: string[]; intro: string }> = {
  desi: {
    label: 'Desi / South Asian',
    keywords: ['desi', 'indian', 'pakistani', 'south asian', 'curry'],
    intro: 'Desi and South Asian dinner ideas — curries, dals, rice dishes, and more from your fridge.',
  },
  arabic: {
    label: 'Arabic / Middle Eastern',
    keywords: ['arabic', 'middle eastern', 'levantine', 'mediterranean'],
    intro: 'Arabic and Middle Eastern dinners — fragrant, shareable plates you can cook at home.',
  },
  chinese: {
    label: 'Chinese',
    keywords: ['chinese', 'stir fry', 'stir-fry', 'wok'],
    intro: 'Chinese-inspired dinners — stir-fries and pantry-friendly meals for tonight.',
  },
  western: {
    label: 'Western',
    keywords: ['western', 'american', 'italian', 'european'],
    intro: 'Western dinner classics — pasta, skillet meals, and familiar comfort food.',
  },
  mexican: {
    label: 'Mexican',
    keywords: ['mexican', 'tex-mex', 'taco', 'burrito'],
    intro: 'Mexican and Tex-Mex dinner ideas — tacos, bowls, and weeknight favorites.',
  },
}

type PagesContext = {
  request: Request
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
  env: Record<string, unknown>
}

function isBot(ua: string): boolean {
  return BOT_RE.test(ua)
}

function shouldSkip(pathname: string): boolean {
  if (pathname.startsWith('/assets')) return true
  if (pathname.startsWith('/cdn-cgi')) return true
  // Static files with extensions
  if (/\.[a-zA-Z0-9]{1,8}$/.test(pathname)) return true
  return false
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlDoc(opts: {
  title: string
  description: string
  canonical: string
  bodyHtml: string
  jsonLd?: unknown
  keywords?: string
  image?: string
  imageAlt?: string
  noIndex?: boolean
  type?: 'website' | 'article'
}): Response {
  const image = opts.image || OG_IMAGE
  const imageAlt = opts.imageAlt || opts.title
  const robots = opts.noIndex ? '<meta name="robots" content="noindex, follow" />' : ''
  const jsonLdBlock = opts.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c')}</script>`
    : ''
  const keywords = opts.keywords
    ? `<meta name="keywords" content="${escapeHtml(opts.keywords)}" />`
    : ''
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  ${keywords}
  <link rel="canonical" href="${escapeHtml(opts.canonical)}" />
  ${robots}
  <meta property="og:type" content="${opts.type || 'website'}" />
  <meta property="og:site_name" content="Dinner From Fridge" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${escapeHtml(opts.canonical)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="icon" type="image/png" href="/app-icon.png" />
  ${jsonLdBlock}
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:1.25rem;line-height:1.5;color:#1a1a1a;background:#faf6f1;max-width:42rem}
    a{color:#C45C26} h1{font-size:1.75rem;margin:0 0 .5rem} h2{font-size:1.15rem;margin:1.25rem 0 .5rem}
    ul{padding-left:1.2rem} .muted{color:#666;font-size:.95rem} nav a{margin-right:.75rem}
  </style>
</head>
<body>
${opts.bodyHtml}
<nav style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e8ddd3">
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/recipes">Recipes</a>
  <a href="/cook/30-min">Cook 30 min</a>
  <a href="/cuisine/desi">Cuisines</a>
  <a href="/leftover-rescue">Leftover rescue</a>
  <a href="/challenge">Fridge challenge</a>
  <a href="/ramadan">Ramadan</a>
  <a href="/eid">Eid</a>
  <a href="/desi">Desi</a>
  <a href="/arabic">Arabic</a>
  <a href="/legal/privacy">Privacy</a>
  <a href="/legal/terms">Terms</a>
</nav>
<p class="muted" style="margin-top:1rem">Dinner From Fridge — cook tonight from what you already have.</p>
</body>
</html>`
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-dff-bot-html': '1',
    },
  })
}

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

type ApiRecipe = {
  id: string
  title: string
  description?: string
  emoji?: string
  prepMinutes?: number
  cookMinutes?: number
  minutes?: number
  servings?: number
  tags?: string[]
  ingredients?: { name: string; quantity?: string | null; unit?: string | null }[]
  steps?: { instruction: string }[]
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number | null
    sodium?: number | null
  } | null
}

function totalMinutes(r: ApiRecipe): number {
  if (typeof r.minutes === 'number' && r.minutes > 0) return r.minutes
  return Math.max(0, (r.prepMinutes || 0) + (r.cookMinutes || 0)) || 30
}

function recipeJsonLd(r: ApiRecipe): Record<string, unknown> {
  const url = `${SITE}/recipe/${encodeURIComponent(r.id)}`
  const ingredients = (r.ingredients || []).map((ing) =>
    [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ').trim() || ing.name,
  )
  const steps = (r.steps || []).map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    text: s.instruction,
  }))
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description || r.title,
    image: [og('recipe'), LOGO],
    url,
    totalTime: `PT${Math.max(1, Math.round(totalMinutes(r)))}M`,
    recipeYield: String(r.servings || 4),
    recipeIngredient: ingredients,
    recipeInstructions: steps,
    keywords: (r.tags || []).join(', '),
    author: { '@type': 'Organization', name: 'Dinner From Fridge', url: SITE },
  }
  const n = r.nutrition
  if (n && (n.calories || n.protein)) {
    ld.nutrition = {
      '@type': 'NutritionInformation',
      calories: n.calories != null ? `${Math.round(n.calories)} calories` : undefined,
      proteinContent: n.protein != null ? `${n.protein} g` : undefined,
      carbohydrateContent: n.carbs != null ? `${n.carbs} g` : undefined,
      fatContent: n.fat != null ? `${n.fat} g` : undefined,
    }
  }
  return ld
}

async function renderRecipe(id: string): Promise<Response> {
  const data = (await fetchJson(`/v1/recipes/${encodeURIComponent(id)}`)) as
    | { recipe?: ApiRecipe }
    | null
  const r = data?.recipe
  if (!r) {
    return htmlDoc({
      title: 'Recipe not found | Dinner From Fridge',
      description: 'This recipe was not found in the Dinner From Fridge catalog.',
      canonical: `${SITE}/recipe/${encodeURIComponent(id)}`,
      bodyHtml: `<h1>Recipe not found</h1><p class="muted">Try <a href="/recipes">browsing recipes</a> or <a href="/capture">scanning your fridge</a>.</p>`,
    })
  }
  const mins = totalMinutes(r)
  const title = `${r.title} recipe (${mins} min) | Dinner From Fridge`
  const description =
    r.description ||
    `Cook ${r.title} in about ${mins} minutes with Dinner From Fridge — leftovers and fridge ingredients welcome.`
  const ingList = (r.ingredients || [])
    .map((ing) => {
      const line = [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ').trim() || ing.name
      return `<li>${escapeHtml(line)}</li>`
    })
    .join('')
  const stepList = (r.steps || [])
    .map((s, i) => `<li><strong>Step ${i + 1}.</strong> ${escapeHtml(s.instruction)}</li>`)
    .join('')
  const body = `
<h1>${escapeHtml(r.emoji || '🍽️')} ${escapeHtml(r.title)}</h1>
<p class="muted">~${mins} min · ${r.servings || 4} servings</p>
<p>${escapeHtml(r.description || '')}</p>
<h2>Ingredients</h2>
<ul>${ingList || '<li>See recipe on Dinner From Fridge</li>'}</ul>
<h2>Steps</h2>
<ol>${stepList || '<li>Open the recipe on Dinner From Fridge for full cook mode.</li>'}</ol>
<p><a href="/capture">Scan your fridge</a> for more dinners you can cook tonight.</p>`
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}/recipe/${encodeURIComponent(r.id)}`,
    keywords: (r.tags || []).join(', '),
    jsonLd: recipeJsonLd(r),
    image: og('recipe'),
    imageAlt: `${r.title} — Dinner From Fridge`,
    type: 'article',
    bodyHtml: body,
  })
}

async function searchSample(q: string, limit = 12): Promise<ApiRecipe[]> {
  const data = (await fetchJson(
    `/v1/recipes/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  )) as { recipes?: ApiRecipe[] } | null
  return Array.isArray(data?.recipes) ? data!.recipes! : []
}

function itemListJsonLd(
  name: string,
  description: string,
  path: string,
  items: ApiRecipe[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE}${path}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/recipe/${encodeURIComponent(r.id)}`,
        name: r.title,
      })),
    },
  }
}

function recipeLinks(items: ApiRecipe[]): string {
  if (!items.length) return '<p class="muted">Browse the full catalog for more ideas.</p>'
  return `<ul>${items
    .map(
      (r) =>
        `<li><a href="/recipe/${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a> <span class="muted">(~${totalMinutes(r)} min)</span></li>`,
    )
    .join('')}</ul>`
}

async function renderCook(slug: string): Promise<Response> {
  const landing = COOK_LANDINGS[slug]
  if (!landing) {
    return htmlDoc({
      title: 'Cook landings | Dinner From Fridge',
      description: 'Easy dinners by cook time.',
      canonical: `${SITE}/cook/${slug}`,
      bodyHtml: `<h1>Cook time landings</h1><ul>${Object.keys(COOK_LANDINGS)
        .map((s) => `<li><a href="/cook/${s}">${escapeHtml(COOK_LANDINGS[s].label)}</a></li>`)
        .join('')}</ul>`,
    })
  }
  const all = await searchSample('', 48)
  const items = all
    .filter((r) => totalMinutes(r) > 0 && totalMinutes(r) <= landing.maxMinutes)
    .slice(0, 16)
  const title = `Easy dinners in ${landing.maxMinutes} minutes | Dinner From Fridge`
  const path = `/cook/${slug}`
  return htmlDoc({
    title,
    description: landing.intro,
    canonical: `${SITE}${path}`,
    keywords: `${landing.maxMinutes} minute meals, quick dinner, cook from fridge`,
    jsonLd: itemListJsonLd(landing.label, landing.intro, path, items),
    bodyHtml: `<h1>${escapeHtml(landing.label)}</h1><p>${escapeHtml(landing.intro)}</p><h2>Sample recipes</h2>${recipeLinks(items)}`,
  })
}

async function renderCuisine(slug: string): Promise<Response> {
  const landing = CUISINE_LANDINGS[slug]
  if (!landing) {
    return htmlDoc({
      title: 'Cuisine recipes | Dinner From Fridge',
      description: 'Browse dinners by cuisine.',
      canonical: `${SITE}/cuisine/${slug}`,
      bodyHtml: `<h1>Cuisines</h1><ul>${Object.keys(CUISINE_LANDINGS)
        .map((s) => `<li><a href="/cuisine/${s}">${escapeHtml(CUISINE_LANDINGS[s].label)}</a></li>`)
        .join('')}</ul>`,
    })
  }
  let items = await searchSample(landing.keywords[0] || slug, 24)
  const hayMatch = (r: ApiRecipe) => {
    const hay = `${r.title} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase()
    return landing.keywords.some((k) => hay.includes(k.toLowerCase()))
  }
  items = items.filter(hayMatch).slice(0, 16)
  if (items.length < 6) {
    const broader = await searchSample('', 48)
    const ids = new Set(items.map((r) => r.id))
    for (const r of broader) {
      if (ids.has(r.id)) continue
      if (hayMatch(r)) {
        items.push(r)
        ids.add(r.id)
      }
      if (items.length >= 16) break
    }
  }
  const title = `${landing.label} recipes you can cook from your fridge | Dinner From Fridge`
  const path = `/cuisine/${slug}`
  return htmlDoc({
    title,
    description: landing.intro,
    canonical: `${SITE}${path}`,
    keywords: `${landing.label}, fridge recipes, leftover dinner`,
    jsonLd: itemListJsonLd(`${landing.label} recipes`, landing.intro, path, items),
    bodyHtml: `<h1>${escapeHtml(landing.label)} recipes</h1><p>${escapeHtml(landing.intro)}</p><h2>Sample recipes</h2>${recipeLinks(items)}`,
  })
}

function renderHome(): Response {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Dinner From Fridge',
      url: SITE,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/recipes?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Dinner From Fridge',
      url: SITE,
      logo: LOGO,
    },
  ]
  return htmlDoc({
    title: 'Dinner From Fridge — cook tonight from what you already have',
    description:
      'Scan your fridge or type ingredients. Match leftovers to world recipes, cook in 15–45 minutes, track nutrition, and plan the week. No pork.',
    canonical: `${SITE}/`,
    keywords: 'fridge recipes, leftover dinner, what to cook tonight, 30 minute meals',
    jsonLd,
    bodyHtml: `<h1>Dinner From Fridge</h1>
<p>Cook tonight from what you already have. Scan your fridge, browse recipes, and get cook steps with scaled ingredients.</p>
<ul>
  <li><a href="/capture">Scan your fridge</a></li>
  <li><a href="/recipes">Browse recipes</a></li>
  <li><a href="/cook/30-min">Easy dinners in 30 minutes</a></li>
  <li><a href="/cuisine/desi">Desi recipes</a> · <a href="/cuisine/arabic">Arabic</a> · <a href="/cuisine/chinese">Chinese</a> · <a href="/cuisine/mexican">Mexican</a> · <a href="/cuisine/western">Western</a></li>
  <li><a href="/sample-fridge">Try a sample fridge</a> — see a scan result instantly</li>
  <li><a href="/leftover-rescue">Leftover rescue</a> — 2–4 ingredient dinners, cook before you shop</li>
  <li><a href="/challenge">Fridge challenge</a> — dare a friend to make dinner from 2–5 ingredients</li>
  <li><a href="/ramadan">Ramadan iftar &amp; suhoor</a> · <a href="/eid">Eid leftovers</a> · <a href="/desi">Desi dinners</a> · <a href="/arabic">Arabic dinners</a></li>
  <li><a href="/about">About Dinner From Fridge</a></li>
</ul>`,
  })
}

function renderAbout(): Response {
  return htmlDoc({
    title: 'About Dinner From Fridge — fridge-to-dinner recipes',
    description:
      'Dinner From Fridge helps home cooks turn leftovers and fridge ingredients into dinner ideas, cook steps, nutrition info, and week plans. No pork in the catalog.',
    canonical: `${SITE}/about`,
    bodyHtml: `<h1>About Dinner From Fridge</h1>
<p>Dinner From Fridge is a web app for busy cooks who want dinner from what is already in the fridge — not another grocery run.</p>
<h2>Who it is for</h2>
<p>Home cooks facing leftovers, a half-empty fridge, or the nightly “what’s for dinner?” question. Useful if you want fast meals (15–45 minutes), world cuisines, or simple nutrition tracking.</p>
<h2>Key features</h2>
<ul>
  <li><strong>Fridge scan</strong> — photo your fridge or pantry for ingredient suggestions.</li>
  <li><strong>Manual ingredients</strong> — type what you have and match catalog recipes.</li>
  <li><strong>World recipes</strong> — Desi, Arabic, Chinese, Western, Mexican, and more.</li>
  <li><strong>Cook mode</strong> — step-by-step instructions with timers.</li>
  <li><strong>Nutrition &amp; goals</strong> — food calculator and optional calorie/protein plans.</li>
  <li><strong>Week plan &amp; shopping list</strong> — plan dinners and fill gaps.</li>
  <li><strong>No pork</strong> — the recipe catalog excludes pork products.</li>
</ul>
<p><a href="/capture">Start with a fridge scan</a> or <a href="/recipes">browse recipes</a>.</p>`,
  })
}

async function renderRecipes(): Promise<Response> {
  const items = (await searchSample('', 20)).slice(0, 16)
  return htmlDoc({
    title: 'Recipes from your fridge | Dinner From Fridge',
    description:
      'Search leftover-friendly dinners and world recipes. Filter by diet preferences and cook tonight from what you have.',
    canonical: `${SITE}/recipes`,
    jsonLd: itemListJsonLd('Recipes', 'Browse Dinner From Fridge recipes', '/recipes', items),
    bodyHtml: `<h1>Recipes</h1>
<p>Search the Dinner From Fridge catalog — leftovers welcome. Try <a href="/recipes?q=chicken">chicken</a>, <a href="/recipes?q=pasta">pasta</a>, or <a href="/recipes?q=dal">dal</a>.</p>
<h2>Sample recipes</h2>${recipeLinks(items)}`,
  })
}


/* ---------------- catalog-backed growth pages ---------------- */

async function loadCatalog(context: PagesContext): Promise<CatalogEntry[]> {
  try {
    const assets = context.env.ASSETS as { fetch: (r: Request | string) => Promise<Response> } | undefined
    const req = new Request(new URL('/catalog-index.json', context.request.url).toString())
    const res = assets ? await assets.fetch(req) : await fetch(req)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? (data as CatalogEntry[]) : []
  } catch {
    return []
  }
}

function entryLinks(items: CatalogEntry[]): string {
  if (!items.length) return '<p class="muted">Browse the full catalog for more ideas.</p>'
  return `<ul>${items
    .map(
      (e) =>
        `<li><a href="/recipe/${encodeURIComponent(e.id)}">${escapeHtml(e.e)} ${escapeHtml(e.t)}</a> <span class="muted">(~${e.m} min)</span></li>`,
    )
    .join('')}</ul>`
}

function entryListJsonLd(name: string, description: string, path: string, items: CatalogEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE}${path}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/recipe/${encodeURIComponent(e.id)}`,
        name: e.t,
      })),
    },
  }
}

async function renderChallenge(context: PagesContext, url: URL): Promise<Response> {
  const items = parseChallengeParam(url.searchParams.get('i'))
  if (items.length < 2) {
    return htmlDoc({
      title: 'Fridge challenge — can you make dinner from these? | Dinner From Fridge',
      description: 'Pick 2–5 ingredients and dare a friend to make dinner from them. See matching recipes instantly.',
      canonical: `${SITE}/challenge`,
      image: og('challenge'),
      bodyHtml: `<h1>Fridge challenge</h1><p>Pick 2–5 ingredients and dare a friend to make dinner from them. Example: <a href="/challenge?i=eggs,spinach,rice">Can you make dinner from eggs, spinach and rice?</a></p>`,
    })
  }
  const catalog = await loadCatalog(context)
  const matches = matchCatalog(catalog, items, { minUsed: Math.min(2, items.length), limit: 12 })
  const list = joinList(items)
  const title = `Can you make dinner from ${list}?`
  const description = `🧑‍🍳 Fridge challenge: dinner from ${list}. ${matches.length ? `${matches.length} recipes can do it — ` : ''}accept the challenge on Dinner From Fridge.`
  const path = `/challenge?i=${challengeQuery(items)}`
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}${path}`,
    image: og('challenge'),
    imageAlt: title,
    noIndex: true,
    jsonLd: entryListJsonLd(title, description, path, matches.map((m) => m.entry)),
    bodyHtml: `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><h2>Recipes that use ${escapeHtml(list)}</h2>${entryLinks(matches.map((m) => m.entry))}<p><a href="/challenge">Make your own challenge</a> · <a href="/capture">Snap your fridge</a></p>`,
  })
}

async function renderLeftovers(context: PagesContext, url: URL): Promise<Response> {
  const catalog = await loadCatalog(context)
  const have = parseChallengeParam(url.searchParams.get('i'), 15)
  const items = have.length
    ? matchCatalog(catalog, have, { maxCore: 4, limit: 16 }).map((m) => m.entry)
    : smallRecipes(catalog, 3, 24)
  const title = have.length
    ? `Leftover rescue: dinner from ${joinList(have)} | Dinner From Fridge`
    : 'Leftover rescue: 2–4 ingredient dinners — cook before you shop | Dinner From Fridge'
  const description =
    'Empty fridge? Find dinners that need only 2–4 main ingredients (salt, oil and spices assumed). Cook before you shop and save money.'
  const path = have.length ? `/leftover-rescue?i=${challengeQuery(have)}` : '/leftover-rescue'
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}${path}`,
    keywords: 'leftover recipes, few ingredient dinners, empty fridge meals, 3 ingredient dinner, cook before you shop, save money on food',
    image: og('leftovers'),
    noIndex: have.length > 0,
    jsonLd: entryListJsonLd('Leftover rescue — dinners with 2–4 ingredients', description, '/leftover-rescue', items),
    bodyHtml: `<h1>Leftover rescue: cook before you shop</h1><p>${escapeHtml(description)}</p><h2>${have.length ? `Dinners using ${escapeHtml(joinList(have))}` : 'Dinners with 3 or fewer main ingredients'}</h2><ul>${items
      .map(
        (e) =>
          `<li><a href="/recipe/${encodeURIComponent(e.id)}">${escapeHtml(e.e)} ${escapeHtml(e.t)}</a> <span class="muted">(~${e.m} min · ${escapeHtml(coreIngredients(e).join(', '))})</span></li>`,
      )
      .join('')}</ul>`,
  })
}

async function renderHub(context: PagesContext, slug: string): Promise<Response | null> {
  const hub = hubBySlug(slug)
  if (!hub) return null
  const catalog = await loadCatalog(context)
  const sections = curateHub(hub, catalog)
  const en = hub.copy.en
  const all = Object.values(sections).flat()
  const local = (['ar', 'ur'] as const)
    .map((l) => {
      const c = hub.copy[l]
      return `<section lang="${l}" dir="rtl"><h2>${escapeHtml(c.h1)}</h2><p>${escapeHtml(c.intro)}</p></section>`
    })
    .join('')
  const body = `<h1>${escapeHtml(hub.emoji)} ${escapeHtml(en.h1)}</h1>
<p>${escapeHtml(en.intro)}</p>
${hub.sections
  .map((s) => `<h2>${escapeHtml(en.sections[s.key]!.h)}</h2><p class="muted">${escapeHtml(en.sections[s.key]!.p)}</p>${entryLinks(sections[s.key] ?? [])}`)
  .join('\n')}
<h2>Tips</h2><ul>${en.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}</ul>
${local}
<p>More collections: ${HUBS.filter((h) => h.slug !== hub.slug).map((h) => `<a href="/${h.slug}">${escapeHtml(h.copy.en.h1)}</a>`).join(' · ')}</p>
<p class="muted">All recipes are halal-friendly. No pork.</p>`
  return htmlDoc({
    title: `${en.title} | Dinner From Fridge`,
    description: en.intro,
    canonical: `${SITE}/${hub.slug}`,
    keywords: hub.keywords,
    image: og(hub.slug),
    jsonLd: entryListJsonLd(en.h1, en.intro, `/${hub.slug}`, all),
    bodyHtml: body,
  })
}

function renderSample(): Response {
  return htmlDoc({
    title: 'Try a sample fridge — see Dinner From Fridge in one tap',
    description: 'See how one fridge photo turns into 3 dinners you can cook tonight. Free demo — no sign-up.',
    canonical: `${SITE}/sample-fridge`,
    image: og('sample'),
    bodyHtml: `<h1>Try a sample fridge</h1><p>A real fridge photo — eggs, tomatoes, yogurt, greens, rice — and the 3 dinners it suggests: Tomato Egg Scramble, Egg Masala Dinner and Fridge Fried Rice.</p><p><a href="/capture">Now snap your own fridge</a></p>`,
  })
}

function renderStreak(): Response {
  return htmlDoc({
    title: 'Home-cooked streak & money saved | Dinner From Fridge',
    description: 'Keep a weekly home-cooking streak and see an estimate of money saved versus takeout. Cook tonight from your fridge.',
    canonical: `${SITE}/streak`,
    image: og('streak'),
    bodyHtml: `<h1>Home-cooked streak</h1><p>Count home-cooked dinners, keep a weekly streak and see an estimate of what you saved versus takeout.</p><p><a href="/capture">Find tonight’s dinner</a></p>`,
  })
}

function decodeShare(raw: string): { meals: { id: string; t: string; e?: string; m?: number }[]; note?: string } | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const bin = atob(padded + pad)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const data = JSON.parse(new TextDecoder().decode(bytes))
    if (!data || data.v !== 1 || !Array.isArray(data.meals) || !data.meals.length) return null
    return data
  } catch {
    return null
  }
}

function renderShare(raw: string, prefix: string): Response {
  const data = decodeShare(raw)
  const canonical = `${SITE}/${prefix}/${raw}`
  if (!data) {
    return htmlDoc({
      title: 'Shared dinners | Dinner From Fridge',
      description: 'Dinner ideas from what’s already in the fridge.',
      canonical,
      image: og('share'),
      noIndex: true,
      bodyHtml: `<h1>Shared dinners</h1><p><a href="/capture">Snap your fridge</a> for dinner ideas.</p>`,
    })
  }
  const meals = data.meals.slice(0, 3)
  const names = meals.map((m) => `${m.e ? `${m.e} ` : ''}${m.t}`)
  const title = meals.length === 1 ? `${names[0]} — tonight’s dinner` : `Tonight’s dinners: ${names.join(' · ')}`
  const description =
    data.note ||
    (meals.length === 1
      ? `Cook ${meals[0]!.t}${meals[0]!.m ? ` in about ${meals[0]!.m} minutes` : ''} from what’s in your fridge. Open the recipe on Dinner From Fridge.`
      : `Dinner ideas picked from a real fridge: ${meals.map((m) => m.t).join(', ')}. Open them or snap your own fridge.`)
  return htmlDoc({
    title,
    description,
    canonical,
    image: og('share'),
    imageAlt: title,
    noIndex: true,
    bodyHtml: `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${meals
      .map((m) => `<li><a href="/recipe/${encodeURIComponent(m.id)}">${escapeHtml(m.t)}</a>${m.m ? ` <span class="muted">(~${m.m} min)</span>` : ''}</li>`)
      .join('')}</ul><p><a href="/capture">Snap your fridge</a></p>`,
  })
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const url = new URL(context.request.url)
  const { pathname } = url

  if (shouldSkip(pathname)) {
    return context.next()
  }

  // Old / alternate paths → canonical leftover rescue URL (keeps ?i=…)
  if (pathname === '/leftovers' || pathname === '/leftovers/' || pathname === '/leftover-rescue/') {
    return Response.redirect(`${url.origin}/leftover-rescue${url.search}`, 301)
  }

  const ua = context.request.headers.get('user-agent') || ''
  if (!isBot(ua)) {
    return context.next()
  }

  try {
    if (pathname === '/' || pathname === '') {
      return renderHome()
    }
    if (pathname === '/about') {
      return renderAbout()
    }
    if (pathname === '/recipes') {
      return await renderRecipes()
    }
    if (pathname === '/challenge' || pathname === '/challenge/') {
      return await renderChallenge(context, url)
    }
    if (pathname === '/leftover-rescue') {
      return await renderLeftovers(context, url)
    }
    const hubMatch = pathname.match(/^\/(ramadan|eid|desi|arabic)\/?$/)
    if (hubMatch) {
      const res = await renderHub(context, hubMatch[1]!)
      if (res) return res
    }
    if (pathname === '/sample-fridge') {
      return renderSample()
    }
    if (pathname === '/streak') {
      return renderStreak()
    }
    const shareMatch = pathname.match(/^\/(s|share)\/([^/]+)\/?$/)
    if (shareMatch) {
      return renderShare(shareMatch[2]!, shareMatch[1]!)
    }
    const recipeMatch = pathname.match(/^\/recipe\/([^/]+)\/?$/)
    if (recipeMatch) {
      return await renderRecipe(decodeURIComponent(recipeMatch[1]))
    }
    const cookMatch = pathname.match(/^\/cook\/([^/]+)\/?$/)
    if (cookMatch && COOK_LANDINGS[cookMatch[1]]) {
      return await renderCook(cookMatch[1])
    }
    const cuisineMatch = pathname.match(/^\/cuisine\/([^/]+)\/?$/)
    if (cuisineMatch && CUISINE_LANDINGS[cuisineMatch[1]]) {
      return await renderCuisine(cuisineMatch[1])
    }
  } catch {
    // Fall through to SPA on errors
  }

  return context.next()
}
