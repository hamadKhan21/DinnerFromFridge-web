#!/usr/bin/env node
/**
 * Builds public/catalog-index.json — a compact, pork-free index of every catalog recipe
 * (id, title, emoji, minutes, difficulty, tags, ingredient names). Used client-side by
 * challenge links, leftover rescue and hub pages, and by the bot-HTML middleware.
 * Run: npm run catalog   (safe to skip; the committed file is used otherwise)
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public', 'catalog-index.json')
const API = process.env.SITEMAP_API_BASE?.replace(/\/+$/, '') || 'https://tonightfromthis.hamad2k9.workers.dev'
const PORK = /\b(pork|bacon|ham|prosciutto|pancetta|chorizo|lard|salami|pepperoni|guanciale)\b/i

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (res.ok) return await res.json()
      if (res.status === 404) return null
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)))
  }
  return null
}

function compact(r) {
  const mins =
    typeof r.minutes === 'number' && r.minutes > 0
      ? r.minutes
      : Math.max(0, (r.prepMinutes || 0) + (r.cookMinutes || 0)) || 30
  const tags = [...new Set([...(r.tags || []), ...(r.cuisine || [])].map((t) => String(t).toLowerCase()))].filter(
    (t) => !['ai', 'catalog', 'seed'].includes(t),
  )
  return {
    id: r.id,
    t: r.title,
    e: r.emoji || '🍽️',
    m: mins,
    d: r.difficulty || 'easy',
    g: tags,
    i: (r.ingredients || []).map((x) => String(x.name || '').trim()).filter(Boolean),
    ds: String(r.description || '').slice(0, 140),
    cal: r.nutrition && r.nutrition.calories ? Math.round(r.nutrition.calories) : undefined,
  }
}

async function main() {
  const list = await getJson(`${API}/v1/recipes/sitemap`)
  if (!list?.recipes?.length) {
    console.warn('[catalog] sitemap fetch failed; keeping existing index')
    if (!existsSync(out)) writeFileSync(out, '[]')
    return
  }
  const ids = list.recipes.map((r) => r.id)
  const results = []
  let idx = 0
  async function worker() {
    while (idx < ids.length) {
      const id = ids[idx++]
      const data = await getJson(`${API}/v1/recipes/${encodeURIComponent(id)}`)
      const r = data?.recipe
      if (!r) continue
      const hay = `${r.title} ${(r.ingredients || []).map((x) => x.name).join(' ')}`
      if (PORK.test(hay)) continue
      results.push(compact(r))
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker))
  results.sort((a, b) => a.t.localeCompare(b.t))
  if (results.length < ids.length * 0.8 && existsSync(out)) {
    const prev = JSON.parse(readFileSync(out, 'utf8'))
    if (prev.length > results.length) {
      console.warn(`[catalog] only ${results.length}/${ids.length} fetched; keeping previous (${prev.length})`)
      return
    }
  }
  writeFileSync(out, JSON.stringify(results))
  console.log(`[catalog] wrote ${results.length} recipes → public/catalog-index.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
