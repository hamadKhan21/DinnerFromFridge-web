import { useEffect } from 'react'

export const SITE_ORIGIN = 'https://dinnerfromfridge.com'
export const SITE_NAME = 'Dinner From Fridge'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/app-icon.png`

export type PageSeo = {
  title: string
  description: string
  /** Absolute or path; default = current location */
  canonical?: string
  image?: string
  type?: 'website' | 'article'
  keywords?: string
  noIndex?: boolean
}

function absUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    if (typeof window !== 'undefined') {
      return `${SITE_ORIGIN}${window.location.pathname}${window.location.search}`
    }
    return SITE_ORIGIN
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_ORIGIN}${path}`
}

function ensureMeta(
  selector: string,
  attrs: Record<string, string>,
): HTMLMetaElement {
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    for (const [k, v] of Object.entries(attrs)) {
      if (k !== 'content') el.setAttribute(k, v)
    }
    document.head.appendChild(el)
  }
  return el
}

function setMetaByName(name: string, content: string) {
  const el = ensureMeta(`meta[name="${name}"]`, { name })
  el.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string) {
  const el = ensureMeta(`meta[property="${property}"]`, { property })
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

/** Apply title, description, canonical, Open Graph, Twitter card. */
export function applyPageSeo(seo: PageSeo) {
  const title = seo.title
  const description = seo.description.trim()
  const canonical = absUrl(seo.canonical)
  const image = absUrl(seo.image || DEFAULT_OG_IMAGE)
  const type = seo.type || 'website'

  document.title = title
  setMetaByName('description', description)
  if (seo.keywords?.trim()) setMetaByName('keywords', seo.keywords.trim())
  if (seo.noIndex) setMetaByName('robots', 'noindex, nofollow')
  else {
    const robots = document.querySelector('meta[name="robots"]')
    if (robots) robots.setAttribute('content', 'index, follow')
  }

  setCanonical(canonical)

  setMetaByProperty('og:title', title)
  setMetaByProperty('og:description', description)
  setMetaByProperty('og:url', canonical)
  setMetaByProperty('og:type', type)
  setMetaByProperty('og:site_name', SITE_NAME)
  setMetaByProperty('og:image', image)

  setMetaByName('twitter:card', 'summary_large_image')
  setMetaByName('twitter:title', title)
  setMetaByName('twitter:description', description)
  setMetaByName('twitter:image', image)
}

/** @deprecated Prefer applyPageSeo / usePageSeo */
export function setDocumentMeta(title: string, description?: string) {
  applyPageSeo({
    title,
    description: description || `${SITE_NAME} — cook tonight from what you already have.`,
  })
}

export function setJsonLd(id: string, object: Record<string, unknown> | Record<string, unknown>[]) {
  const scriptId = `jsonld-${id}`
  let el = document.getElementById(scriptId) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = scriptId
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(object)
}

export function clearJsonLd(id: string) {
  document.getElementById(`jsonld-${id}`)?.remove()
}

/**
 * Apply page SEO on mount; clear listed JSON-LD ids on unmount.
 * Pass a stable seo object (or memoize) to avoid thrashing.
 */
export function usePageSeo(
  seo: PageSeo | null | undefined,
  jsonLd?: { id: string; data: Record<string, unknown> | Record<string, unknown>[] }[],
) {
  const title = seo?.title ?? ''
  const description = seo?.description ?? ''
  const canonical = seo?.canonical
  const image = seo?.image
  const type = seo?.type
  const keywords = seo?.keywords
  const noIndex = seo?.noIndex
  const jsonLdSerialized = jsonLd
    ? JSON.stringify(jsonLd.map((j) => ({ id: j.id, data: j.data })))
    : ''

  useEffect(() => {
    if (!title || !description) return
    applyPageSeo({
      title,
      description,
      canonical,
      image,
      type,
      keywords,
      noIndex,
    })
    const ids: string[] = []
    if (jsonLdSerialized) {
      const parsed = JSON.parse(jsonLdSerialized) as {
        id: string
        data: Record<string, unknown> | Record<string, unknown>[]
      }[]
      for (const entry of parsed) {
        setJsonLd(entry.id, entry.data)
        ids.push(entry.id)
      }
    }
    return () => {
      for (const id of ids) clearJsonLd(id)
    }
  }, [title, description, canonical, image, type, keywords, noIndex, jsonLdSerialized])
}

export function recipeMinutesIso(totalMin: number): string {
  const n = Math.max(1, Math.round(totalMin || 1))
  return `PT${n}M`
}

export function buildRecipeJsonLd(recipe: {
  id: string
  title: string
  description: string
  emoji?: string
  ingredients: { name: string; quantity?: string | null; unit?: string | null }[]
  steps: { instruction: string }[]
  totalMinutes: number
  servings: number
  tags?: string[]
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number | null
    sodium?: number | null
  } | null
}): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/recipe/${encodeURIComponent(recipe.id)}`
  const ingredientStrings = recipe.ingredients.map((ing) => {
    const parts = [ing.quantity, ing.unit, ing.name].filter(Boolean)
    return parts.join(' ').trim() || ing.name
  })
  const steps = recipe.steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    text: s.instruction,
  }))
  const keywords = (recipe.tags || []).join(', ')
  const cuisine = (recipe.tags || []).slice(0, 3).join(', ') || undefined

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: [DEFAULT_OG_IMAGE],
    url,
    mainEntityOfPage: url,
    totalTime: recipeMinutesIso(recipe.totalMinutes),
    recipeYield: String(recipe.servings || 4),
    recipeIngredient: ingredientStrings,
    recipeInstructions: steps,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_ORIGIN, logo: DEFAULT_OG_IMAGE },
  }
  if (keywords) ld.keywords = keywords
  if (cuisine) ld.recipeCuisine = cuisine
  if (recipe.emoji) ld.alternateName = `${recipe.emoji} ${recipe.title}`

  const n = recipe.nutrition
  if (n && (n.calories || n.protein || n.carbs || n.fat)) {
    const nutrition: Record<string, unknown> = {
      '@type': 'NutritionInformation',
    }
    if (n.calories != null) nutrition.calories = `${Math.round(n.calories)} calories`
    if (n.protein != null) nutrition.proteinContent = `${n.protein} g`
    if (n.carbs != null) nutrition.carbohydrateContent = `${n.carbs} g`
    if (n.fat != null) nutrition.fatContent = `${n.fat} g`
    if (n.fiber != null) nutrition.fiberContent = `${n.fiber} g`
    if (n.sodium != null) nutrition.sodiumContent = `${n.sodium} mg`
    ld.nutrition = nutrition
  }
  return ld
}

export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description:
      'Turn fridge leftovers into dinner ideas. Scan what you have, browse world recipes, cook in 15–45 minutes. No pork.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/recipes?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: DEFAULT_OG_IMAGE,
    description:
      'Dinner From Fridge helps you cook tonight from ingredients you already have — fridge scan, catalog recipes, nutrition, and week planning. No pork products.',
  }
}

export function buildItemListJsonLd(
  name: string,
  description: string,
  pagePath: string,
  items: { id: string; title: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE_ORIGIN}${pagePath}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_ORIGIN}/recipe/${encodeURIComponent(item.id)}`,
        name: item.title,
      })),
    },
  }
}
