/**
 * Pure (DOM-free) helpers over the compact catalog index (public/catalog-index.json).
 * Shared by the SPA and the Pages bot-HTML middleware.
 */

export interface CatalogEntry {
  id: string
  /** title */
  t: string
  /** emoji */
  e: string
  /** total minutes */
  m: number
  /** difficulty */
  d: string
  /** tags (lowercase) */
  g: string[]
  /** ingredient names */
  i: string[]
  /** short description */
  ds: string
  cal?: number
}

/** Things most kitchens already have — optional for leftover / challenge matching. */
const STAPLE_RE =
  /^(salt|oil|olive oil|vegetable oil|cooking oil|sesame oil|mustard oil|pepper|black pepper|white pepper|garlic|onion|onions|red onion|ginger|cumin|cumin seeds|turmeric|paprika|chili powder|chilli powder|chili flakes|red pepper flakes|garam masala|curry powder|coriander|ground coriander|cinnamon|oregano|thyme|whole spices|.*masala|.*spices|.*seasoning|baharat|sumac|star anise|saffron|soy sauce|butter|ghee|sugar|brown sugar|flour|water|broth|stock|chicken broth|vegetable broth|chicken stock|lemon|lime|lemon juice|vinegar|rice vinegar|honey|cornstarch|baking powder|sesame seeds|sesame|cilantro|parsley|mint|basil|green chili|green chilies|chili|dried chili|red chili|curry leaves|ketchup|mayo|mayonnaise|mustard|tomato paste|hot sauce|sriracha)$/i

export function isStaple(name: string): boolean {
  return STAPLE_RE.test(name.trim().toLowerCase())
}

export function coreIngredients(entry: CatalogEntry): string[] {
  return entry.i.filter((n) => !isStaple(n))
}

function singular(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`
  if (w.length > 4 && w.endsWith('oes')) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('es') && /(ch|sh|ss|x)es$/.test(w)) return w.slice(0, -2)
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(',')[0]!
    .replace(/[^a-z\u00c0-\u024f\u0600-\u06ff\s-]/g, ' ')
    .replace(/\b(fresh|frozen|cooked|leftover|chopped|diced|sliced|large|small|medium|boneless|skinless|ground|minced|canned|dried|raw|greek|plain|baby|cherry)\b/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .join(' ')
    .trim()
}

/** True when a user item (e.g. "eggs") covers a recipe ingredient (e.g. "Egg"). */
export function ingredientCovers(userItem: string, recipeIngredient: string): boolean {
  const a = normalizeIngredient(userItem)
  const b = normalizeIngredient(recipeIngredient)
  if (!a || !b) return false
  if (a === b) return true
  const aw = a.split(' ')
  const bw = new Set(b.split(' '))
  // every word of the user's item appears in the recipe ingredient ("chicken" ⊂ "chicken thigh")
  if (aw.every((w) => bw.has(w))) return true
  const bArr = b.split(' ')
  return bArr.length === 1 && aw.includes(bArr[0]!) && bArr[0]!.length > 3
}

export interface CatalogMatch {
  entry: CatalogEntry
  /** user items used by this recipe */
  used: string[]
  /** core (non-staple) recipe ingredients the user doesn't have */
  missingCore: string[]
  coreCount: number
  score: number
}

/**
 * Rank catalog recipes by how well they use `have`.
 * Staples are treated as optional. `maxCore` limits recipes to small ingredient counts.
 */
export function matchCatalog(
  catalog: CatalogEntry[],
  have: string[],
  opts: { maxCore?: number; limit?: number; requireAllUsed?: boolean; minUsed?: number } = {},
): CatalogMatch[] {
  const items = have.map((h) => h.trim()).filter(Boolean)
  const out: CatalogMatch[] = []
  for (const entry of catalog) {
    const core = coreIngredients(entry)
    if (opts.maxCore != null && core.length > opts.maxCore) continue
    const used = items.filter((h) => entry.i.some((ing) => ingredientCovers(h, ing)))
    if (!used.length) continue
    if (opts.minUsed != null && used.length < opts.minUsed) continue
    if (opts.requireAllUsed && used.length < items.length) continue
    const missingCore = core.filter((ing) => !items.some((h) => ingredientCovers(h, ing)))
    const score =
      used.length * 10 - missingCore.length * 4 - core.length * 0.5 - Math.min(entry.m, 90) / 60
    out.push({ entry, used, missingCore, coreCount: core.length, score })
  }
  out.sort((a, b) => b.score - a.score || a.entry.m - b.entry.m)
  return out.slice(0, opts.limit ?? 24)
}

/** Recipes that need only a few non-staple ingredients (leftover rescue browse). */
export function smallRecipes(catalog: CatalogEntry[], maxCore = 3, limit = 30): CatalogEntry[] {
  const list = catalog
    .filter((e) => coreIngredients(e).length <= maxCore && coreIngredients(e).length >= 1)
    .sort((a, b) => coreIngredients(a).length - coreIngredients(b).length || a.m - b.m)
  return diversify(list, limit, 1)
}

/* ---------------- Challenge links ---------------- */

export const CHALLENGE_MIN = 2
export const CHALLENGE_MAX = 5

export function parseChallengeParam(raw: string | null | undefined, max = CHALLENGE_MAX): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  const list: string[] = []
  for (const part of raw.split(/[,|]/)) {
    const v = part.replace(/[-_+]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 32)
    const key = v.toLowerCase()
    if (!v || seen.has(key)) continue
    if (/\b(pork|bacon|ham|lard|prosciutto|pancetta|pepperoni|salami)\b/i.test(v)) continue
    seen.add(key)
    list.push(v)
    if (list.length >= max) break
  }
  return list
}

export function challengeQuery(items: string[]): string {
  // eggs,spinach,bell+pepper — commas between items, + between words (matches the mobile app)
  return items
    .map((s) => s.trim().toLowerCase().split(/\s+/).filter(Boolean).map(encodeURIComponent).join('+'))
    .filter(Boolean)
    .join(',')
}

export function joinList(items: string[], and = 'and'): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} ${and} ${items[1]}`
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`
}

/* ---------------- Hub pages ---------------- */

export interface HubRule {
  /** tags that qualify (any) */
  tags?: string[]
  /** title / description words that qualify (any) */
  words?: string[]
  /** max minutes */
  maxMinutes?: number
  /** words to boost to the top */
  boost?: string[]
}

export function filterHub(catalog: CatalogEntry[], rule: HubRule, limit = 36): CatalogEntry[] {
  const words = (rule.words || []).map((w) => w.toLowerCase())
  const tags = new Set((rule.tags || []).map((t) => t.toLowerCase()))
  const boost = (rule.boost || []).map((w) => w.toLowerCase())
  const scored: { e: CatalogEntry; s: number }[] = []
  for (const e of catalog) {
    if (rule.maxMinutes != null && e.m > rule.maxMinutes) continue
    const hay = `${e.t} ${e.ds}`.toLowerCase()
    const tagHit = e.g.some((t) => tags.has(t))
    const wordHit = words.some((w) => hay.includes(w))
    if (!tagHit && !wordHit) continue
    let s = (tagHit ? 2 : 0) + (wordHit ? 3 : 0)
    for (const b of boost) if (hay.includes(b)) s += 4
    s -= e.m / 120
    scored.push({ e, s })
  }
  scored.sort((a, b) => b.s - a.s || a.e.t.localeCompare(b.e.t))
  return diversify(scored.map((x) => x.e), limit)
}

/** Title "family" so we don't show ten "X Shawarma Bowl" variants in a row. */
function titleFamily(title: string): string {
  const w = title.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
  return w.length > 1 ? w.slice(1, 3).join(' ') : w.join(' ')
}

export function diversify(list: CatalogEntry[], limit: number, perFamily = 2): CatalogEntry[] {
  const fam = new Map<string, number>()
  const seenTitle = new Set<string>()
  const out: CatalogEntry[] = []
  for (const e of list) {
    const k = titleFamily(e.t)
    const n = fam.get(k) ?? 0
    const tk = e.t.toLowerCase().split(' ').slice(0, 2).join(' ')
    if (n >= perFamily || seenTitle.has(tk)) continue
    fam.set(k, n + 1)
    seenTitle.add(tk)
    out.push(e)
    if (out.length >= limit) break
  }
  return out
}
