import { useEffect, useState } from 'react'
import type { Recipe } from '../api/types'
import type { CatalogEntry } from './catalogMatch'

let cached: Promise<CatalogEntry[]> | null = null

/** Lazy-load the compact catalog index (static file, ~50 KB gzipped). */
export function loadCatalog(): Promise<CatalogEntry[]> {
  if (!cached) {
    cached = fetch('/catalog-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => (Array.isArray(d) ? (d as CatalogEntry[]) : []))
      .catch(() => {
        cached = null
        return []
      })
  }
  return cached
}

export function useCatalog(): { catalog: CatalogEntry[]; loading: boolean } {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    void loadCatalog().then((c) => {
      if (!alive) return
      setCatalog(c)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])
  return { catalog, loading }
}

/** Minimal Recipe stub so the detail page can render instantly, then refresh from the catalog. */
export function stubRecipe(e: CatalogEntry): Recipe {
  return {
    id: e.id,
    title: e.t,
    description: e.ds,
    ingredients: e.i.map((name) => ({ name })),
    steps: [],
    prepMinutes: 0,
    cookMinutes: e.m,
    servings: 4,
    difficulty: (e.d as Recipe['difficulty']) || 'easy',
    tags: e.g,
    emoji: e.e,
  }
}
