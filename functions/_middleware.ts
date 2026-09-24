/**
 * Cloudflare Pages middleware: serve contentful HTML to known crawlers
 * so Google / AI bots that do not execute JS still see titles, meta, JSON-LD, and body text.
 * Normal browsers pass through to the SPA.
 */

const API_BASE = 'https://tonightfromthis.hamad2k9.workers.dev'
const SITE = 'https://dinnerfromfridge.com'
const OG_IMAGE = `${SITE}/app-icon.png`

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
}): Response {
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
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Dinner From Fridge" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${escapeHtml(opts.canonical)}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
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
    image: [OG_IMAGE],
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
      logo: OG_IMAGE,
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

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const url = new URL(context.request.url)
  const { pathname } = url

  if (shouldSkip(pathname)) {
    return context.next()
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
