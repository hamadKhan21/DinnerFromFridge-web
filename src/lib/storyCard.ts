/**
 * Client-side 1080×1920 (9:16) story images drawn on <canvas>.
 * Nothing is uploaded — images are generated on the device.
 */

export const STORY_W = 1080
export const STORY_H = 1920
const TERRA = '#C45C26'
const TERRA_DARK = '#9A3F12'
const INK = '#2C2118'
const MUTED = '#7A6A5A'
const CREAM = '#FFF8F1'
const CHIP = '#FFE8D6'
const FONT = '-apple-system, "SF Pro Display", "Segoe UI", system-ui, Roboto, "Noto Sans", "Noto Sans Arabic", sans-serif'
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
export const SITE_LABEL = 'dinnerfromfridge.com'
const THUMB_KEY = 'dff_last_fridge_photo'

type Dir = 'ltr' | 'rtl'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / r
  const sh = h / r
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test
    } else {
      lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]!
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last.trimEnd()}…`
    return kept
  }
  return lines
}

/** Fit a single line by shrinking the font. Returns chosen size. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, min: number, maxWidth: number): number {
  let size = start
  while (size > min) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 4
  }
  return size
}

function newCanvas(dir: Dir): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')!
  ctx.direction = dir
  ctx.textBaseline = 'alphabetic'
  return { canvas, ctx }
}

/**
 * Instagram / WhatsApp Stories cover roughly the top ~250px and bottom ~420px with UI
 * and may crop the sides. Everything that matters stays inside this box;
 * outside it there is only decorative background.
 */
export const SAFE = { top: 260, bottom: 1480, left: 90, right: 990 } as const
const SAFE_W = SAFE.right - SAFE.left
/** Content must end above the CTA block. */
const CONTENT_BOTTOM = 1250

function paintBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, STORY_H)
  g.addColorStop(0, '#F6D3B8')
  g.addColorStop(0.16, '#FFF3E6')
  g.addColorStop(0.6, CREAM)
  g.addColorStop(1, '#F6D3B8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, STORY_W, STORY_H)
  // soft decorative circles (outside / at the edge of the safe zone only)
  ctx.fillStyle = 'rgba(196,92,38,0.08)'
  ctx.beginPath()
  ctx.arc(1000, 120, 240, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(60, 1760, 260, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(1040, 1860, 180, 0, Math.PI * 2)
  ctx.fill()
}

async function paintBrand(ctx: CanvasRenderingContext2D, dir: Dir) {
  const logo = await loadImage('/icon-192.png')
  const size = 84
  const y = SAFE.top + 10
  const brand = 'Dinner From Fridge'
  ctx.font = `800 44px ${FONT}`
  const tw = ctx.measureText(brand).width
  const gap = 22
  const total = size + gap + tw
  const x0 = (STORY_W - total) / 2
  const logoX = dir === 'rtl' ? x0 + tw + gap : x0
  if (logo) {
    ctx.save()
    roundRect(ctx, logoX, y, size, size, 22)
    ctx.clip()
    ctx.drawImage(logo, logoX, y, size, size)
    ctx.restore()
  }
  ctx.fillStyle = TERRA_DARK
  ctx.textAlign = 'left'
  ctx.direction = 'ltr'
  ctx.fillText(brand, dir === 'rtl' ? x0 : x0 + size + gap, y + 58)
  ctx.direction = dir
}

/** CTA line + big domain pill, fully inside the safe zone (ends at ~1470). */
function paintCta(ctx: CanvasRenderingContext2D, cta: string) {
  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  const size = fitFont(ctx, cta, 700, 46, 30, SAFE_W - 20)
  ctx.font = `700 ${size}px ${FONT}`
  ctx.fillText(cta, STORY_W / 2, 1318)
  const pillW = 820
  const pillH = 116
  const px = (STORY_W - pillW) / 2
  const py = 1352
  ctx.save()
  ctx.shadowColor = 'rgba(154,63,18,0.35)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8
  roundRect(ctx, px, py, pillW, pillH, pillH / 2)
  ctx.fillStyle = TERRA
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#FFFFFF'
  ctx.direction = 'ltr'
  const ds = fitFont(ctx, SITE_LABEL, 800, 62, 40, pillW - 70)
  ctx.font = `800 ${ds}px ${FONT}`
  ctx.fillText(SITE_LABEL, STORY_W / 2, py + pillH / 2 + ds * 0.36)
}

function paintEmoji(ctx: CanvasRenderingContext2D, emoji: string, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${size}px ${EMOJI_FONT}`
  ctx.fillText(emoji || '🍽️', cx, cy + size * 0.06)
  ctx.restore()
}

function chipMetrics(font: number) {
  const h = font * 1.8
  return { h, gap: 16, row: h + 16 }
}

/** Chips laid out in rows, centered inside the safe zone. Returns bottom y. */
function paintChips(ctx: CanvasRenderingContext2D, items: string[], top: number, opts: { font: number; maxRows: number; fill?: string; color?: string }): number {
  ctx.font = `600 ${opts.font}px ${FONT}`
  const padX = opts.font * 0.7
  const { h, gap } = chipMetrics(opts.font)
  const maxW = SAFE_W - 20
  const rows: { text: string; w: number }[][] = [[]]
  let rowW = 0
  for (const raw of items) {
    let text = raw
    while (ctx.measureText(text).width + padX * 2 > maxW && text.length > 3) text = `${text.slice(0, -2)}…`
    const w = ctx.measureText(text).width + padX * 2
    if (rowW + w + (rows[rows.length - 1]!.length ? gap : 0) > maxW && rows[rows.length - 1]!.length) {
      if (rows.length >= opts.maxRows) break
      rows.push([])
      rowW = 0
    }
    rows[rows.length - 1]!.push({ text, w })
    rowW += w + (rows[rows.length - 1]!.length > 1 ? gap : 0)
  }
  let y = top
  for (const row of rows) {
    const total = row.reduce((s, c) => s + c.w, 0) + gap * Math.max(0, row.length - 1)
    let x = (STORY_W - total) / 2
    for (const c of row) {
      roundRect(ctx, x, y, c.w, h, h / 2)
      ctx.fillStyle = opts.fill ?? '#FFFFFF'
      ctx.fill()
      ctx.fillStyle = opts.color ?? INK
      ctx.textAlign = 'center'
      ctx.fillText(c.text, x + c.w / 2, y + h * 0.66)
      x += c.w + gap
    }
    y += h + gap
  }
  return y
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/jpeg', 0.9)
  })
}

export interface RecipeStoryInput {
  title: string
  emoji: string
  minutes: number
  ingredients: string[]
  photo?: string | null
  kicker: string
  minutesLabel: string
  ingredientsLabel: string
  cta: string
  dir?: Dir
}

export async function renderRecipeStory(input: RecipeStoryInput): Promise<Blob> {
  const dir = input.dir ?? 'ltr'
  const { canvas, ctx } = newCanvas(dir)
  paintBackground(ctx)
  await paintBrand(ctx, dir)

  ctx.textAlign = 'center'
  ctx.fillStyle = TERRA
  const ks = fitFont(ctx, input.kicker, 700, 40, 28, SAFE_W)
  ctx.font = `700 ${ks}px ${FONT}`
  ctx.fillText(input.kicker, STORY_W / 2, 425)

  const photo = input.photo ? await loadImage(input.photo) : null
  let y: number
  if (photo) {
    const bw = 820
    const bh = 360
    const bx = (STORY_W - bw) / 2
    const by = 455
    ctx.save()
    ctx.shadowColor = 'rgba(44,33,24,0.25)'
    ctx.shadowBlur = 32
    ctx.shadowOffsetY = 12
    roundRect(ctx, bx, by, bw, bh, 48)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.restore()
    ctx.save()
    roundRect(ctx, bx, by, bw, bh, 48)
    ctx.clip()
    drawCover(ctx, photo, bx, by, bw, bh)
    ctx.restore()
    // emoji bubble overlapping the photo's bottom edge
    ctx.save()
    ctx.shadowColor = 'rgba(44,33,24,0.25)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(STORY_W / 2, by + bh, 80, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.restore()
    paintEmoji(ctx, input.emoji, STORY_W / 2, by + bh, 96)
    y = by + bh + 80 + 88
  } else {
    ctx.beginPath()
    ctx.arc(STORY_W / 2, 620, 170, 0, Math.PI * 2)
    ctx.fillStyle = CHIP
    ctx.fill()
    paintEmoji(ctx, input.emoji, STORY_W / 2, 620, 200)
    y = 900
  }

  // Title (max 2 lines, shrinks to fit)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  let size = 86
  let lines: string[] = []
  for (; size >= 56; size -= 6) {
    ctx.font = `800 ${size}px ${FONT}`
    lines = wrapLines(ctx, input.title, SAFE_W - 20, 2)
    if (!lines.some((l) => l.endsWith('…'))) break
  }
  ctx.font = `800 ${size}px ${FONT}`
  for (const l of lines) {
    ctx.fillText(l, STORY_W / 2, y)
    y += size * 1.08
  }

  // time pill
  const timeText = `⏱ ${input.minutesLabel}`
  ctx.font = `700 40px ${FONT}`
  const tw = ctx.measureText(timeText).width + 64
  const pillTop = y - 22
  roundRect(ctx, (STORY_W - tw) / 2, pillTop, tw, 72, 36)
  ctx.fillStyle = TERRA
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(timeText, STORY_W / 2, pillTop + 50)
  y = pillTop + 72 + 44

  // ingredients: chips if they fit above CONTENT_BOTTOM, else one muted line
  if (input.ingredients.length) {
    const { row } = chipMetrics(36)
    const labelH = 44
    const rowsFit = Math.floor((CONTENT_BOTTOM - (y + labelH)) / row)
    if (rowsFit >= 1) {
      ctx.fillStyle = MUTED
      ctx.font = `700 32px ${FONT}`
      ctx.fillText(input.ingredientsLabel, STORY_W / 2, y + 10)
      paintChips(ctx, input.ingredients.slice(0, 8), y + labelH, { font: 36, maxRows: Math.min(2, rowsFit) })
    } else if (y + 10 < CONTENT_BOTTOM) {
      ctx.fillStyle = MUTED
      ctx.font = `600 36px ${FONT}`
      const [line] = wrapLines(ctx, input.ingredients.join(' · '), SAFE_W - 20, 1)
      ctx.fillText(line ?? '', STORY_W / 2, y + 20)
    }
  }

  paintCta(ctx, input.cta)
  return toBlob(canvas)
}

export interface ChallengeStoryInput {
  items: string[]
  headline: string
  sub: string
  cta: string
  dir?: Dir
}

export async function renderChallengeStory(input: ChallengeStoryInput): Promise<Blob> {
  const dir = input.dir ?? 'ltr'
  const { canvas, ctx } = newCanvas(dir)
  paintBackground(ctx)
  await paintBrand(ctx, dir)

  paintEmoji(ctx, '🧑‍🍳', STORY_W / 2, 480, 150)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  let hs = 74
  let lines: string[] = []
  for (; hs >= 54; hs -= 4) {
    ctx.font = `800 ${hs}px ${FONT}`
    lines = wrapLines(ctx, input.headline, SAFE_W - 20, 3)
    if (!lines.some((l) => l.endsWith('…'))) break
  }
  ctx.font = `800 ${hs}px ${FONT}`
  let y = 640
  for (const l of lines) {
    ctx.fillText(l, STORY_W / 2, y)
    y += hs * 1.14
  }
  y += 6
  const subH = 60
  const chipFont = input.items.length > 3 ? 44 : 50
  const rows = Math.max(1, Math.min(3, Math.floor((CONTENT_BOTTOM - subH - y) / chipMetrics(chipFont).row)))
  y = paintChips(ctx, input.items, y, { font: chipFont, maxRows: rows, fill: TERRA, color: '#FFFFFF' })
  ctx.fillStyle = MUTED
  ctx.font = `600 38px ${FONT}`
  const [sub] = wrapLines(ctx, input.sub, SAFE_W - 20, 1)
  ctx.fillText(sub ?? '', STORY_W / 2, Math.min(y + 40, CONTENT_BOTTOM))
  paintCta(ctx, input.cta)
  return toBlob(canvas)
}

export interface BadgeStoryInput {
  bigNumber: string
  bigLabel: string
  lines: string[]
  footnote: string
  cta: string
  dir?: Dir
}

export async function renderBadgeStory(input: BadgeStoryInput): Promise<Blob> {
  const dir = input.dir ?? 'ltr'
  const { canvas, ctx } = newCanvas(dir)
  paintBackground(ctx)
  await paintBrand(ctx, dir)

  const cx = STORY_W / 2
  const cy = 660
  const R = 230
  const g = ctx.createRadialGradient(cx, cy - 60, 30, cx, cy, R + 20)
  g.addColorStop(0, '#F08A4B')
  g.addColorStop(1, TERRA_DARK)
  ctx.save()
  ctx.shadowColor = 'rgba(154,63,18,0.4)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 14
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(cx, cy, R - 30, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 6
  ctx.stroke()
  paintEmoji(ctx, '🔥', cx, cy - 135, 70)
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.direction = 'ltr'
  const ns = fitFont(ctx, input.bigNumber, 900, 160, 90, 320)
  ctx.font = `900 ${ns}px ${FONT}`
  ctx.fillText(input.bigNumber, cx, cy + 55)
  ctx.direction = dir
  const ls = fitFont(ctx, input.bigLabel, 700, 40, 26, 320)
  ctx.font = `700 ${ls}px ${FONT}`
  ctx.fillText(input.bigLabel, cx, cy + 125)

  let y = cy + R + 110
  ctx.fillStyle = INK
  for (const l of input.lines) {
    const s2 = fitFont(ctx, l, 800, 58, 36, SAFE_W - 20)
    ctx.font = `800 ${s2}px ${FONT}`
    ctx.fillText(l, cx, y)
    y += 80
  }
  ctx.fillStyle = MUTED
  ctx.font = `500 32px ${FONT}`
  const [foot] = wrapLines(ctx, input.footnote, SAFE_W - 20, 1)
  ctx.fillText(foot ?? '', cx, Math.min(y, CONTENT_BOTTOM))
  paintCta(ctx, input.cta)
  return toBlob(canvas)
}

/* ---- fridge photo thumbnail (kept only in this browser tab) ---- */

export async function saveFridgeThumb(jpegBase64: string): Promise<void> {
  try {
    const img = await loadImage(`data:image/jpeg;base64,${jpegBase64}`)
    if (!img) return
    const max = 720
    const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * r)
    c.height = Math.round(img.naturalHeight * r)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    sessionStorage.setItem(THUMB_KEY, c.toDataURL('image/jpeg', 0.72))
  } catch {
    /* storage full / unsupported — the card works without a photo */
  }
}

export function loadFridgeThumb(): string | null {
  try {
    return sessionStorage.getItem(THUMB_KEY)
  } catch {
    return null
  }
}

export function clearFridgeThumb() {
  try {
    sessionStorage.removeItem(THUMB_KEY)
  } catch {
    /* ignore */
  }
}
