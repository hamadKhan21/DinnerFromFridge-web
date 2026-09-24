#!/usr/bin/env node
/**
 * Fetches catalog recipe ids from the Worker and writes public/sitemap.xml
 * (and optionally sitemap-recipes.xml + sitemap index if URL count is large).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const SITE = 'https://dinnerfromfridge.com'
const API =
  process.env.SITEMAP_API_BASE?.replace(/\/+$/, '') ||
  'https://tonightfromthis.hamad2k9.workers.dev'

const STATIC_ROUTES = [
  '/',
  '/about',
  '/recipes',
  '/capture',
  '/nutrition',
  '/goals',
  '/ingredients',
  '/shopping',
  '/favorites',
  '/week-plan',
  '/settings',
  '/cook/15-min',
  '/cook/20-min',
  '/cook/30-min',
  '/cook/45-min',
  '/cuisine/desi',
  '/cuisine/arabic',
  '/cuisine/chinese',
  '/cuisine/western',
  '/cuisine/mexican',
  '/legal/privacy',
  '/legal/terms',
]

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function urlEntry(loc, lastmod) {
  const lm = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : ''
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lm}\n  </url>`
}

async function fetchRecipes() {
  const url = `${API}/v1/recipes/sitemap`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Sitemap API ${url} → ${res.status}`)
  }
  const data = await res.json()
  const list = Array.isArray(data?.recipes) ? data.recipes : []
  return list
    .filter((r) => r && typeof r.id === 'string' && r.id.length > 0)
    .map((r) => ({
      id: r.id,
      title: typeof r.title === 'string' ? r.title : '',
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
    }))
}

function writeUrlset(filePath, entries) {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
  writeFileSync(filePath, body, 'utf8')
}

async function main() {
  mkdirSync(publicDir, { recursive: true })
  mkdirSync(join(publicDir, '.well-known'), { recursive: true })

  let recipes = []
  try {
    recipes = await fetchRecipes()
    console.log(`[sitemap] fetched ${recipes.length} recipes from ${API}`)
  } catch (e) {
    console.warn(`[sitemap] API fetch failed (${e instanceof Error ? e.message : e}); writing static routes only`)
  }

  const today = new Date().toISOString().slice(0, 10)
  const staticEntries = STATIC_ROUTES.map((p) =>
    urlEntry(`${SITE}${p === '/' ? '/' : p}`, today),
  )
  const recipeEntries = recipes.map((r) =>
    urlEntry(
      `${SITE}/recipe/${encodeURIComponent(r.id)}`,
      r.updatedAt ? r.updatedAt.slice(0, 10) : today,
    ),
  )

  const total = staticEntries.length + recipeEntries.length
  // Google allows 50k URLs per file; only split if clearly large.
  if (total > 1000 && recipeEntries.length > 800) {
    writeUrlset(join(publicDir, 'sitemap-static.xml'), staticEntries)
    writeUrlset(join(publicDir, 'sitemap-recipes.xml'), recipeEntries)
    const index = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `  <sitemap>\n    <loc>${SITE}/sitemap-static.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
      `  <sitemap>\n    <loc>${SITE}/sitemap-recipes.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`,
      '</sitemapindex>',
      '',
    ].join('\n')
    writeFileSync(join(publicDir, 'sitemap.xml'), index, 'utf8')
    console.log(`[sitemap] wrote index + static (${staticEntries.length}) + recipes (${recipeEntries.length})`)
  } else {
    writeUrlset(join(publicDir, 'sitemap.xml'), [...staticEntries, ...recipeEntries])
    console.log(`[sitemap] wrote sitemap.xml with ${total} URLs`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
