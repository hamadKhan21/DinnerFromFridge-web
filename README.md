# Dinner From Fridge (Web)

React web client for **Dinner From Fridge**. Uses the existing Cloudflare Worker API — this repo does **not** rebuild the backend.

Default API: `https://tonightfromthis.hamad2k9.workers.dev`

## Stack

- Vite + React + TypeScript
- React Router
- Tailwind CSS v4
- TanStack Query (provider ready)
- SPA fallback for Cloudflare Pages (`public/_redirects`)

## Local development

```bash
npm install
cp .env.example .env   # optional; defaults already point at the live Worker
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Build:

```bash
npm run build
npm run preview
```

### Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Worker base URL (no trailing slash). Default: production Worker. |

No API secrets belong in the frontend. The Worker enforces free AI quota (3) via `deviceId` (UUID in `localStorage`).

## Cloudflare Pages deploy

When you buy a domain (or use `*.pages.dev`):

### Option A — Connect GitHub (recommended)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select `hamadKhan21/DinnerFromFridge-web`, branch `main`
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Environment variables (optional):
   - `VITE_API_BASE_URL` = `https://tonightfromthis.hamad2k9.workers.dev`
5. Deploy. SPA routes work via `public/_redirects` → `/* /index.html 200`.
6. Custom domain: Pages → your project → **Custom domains** → add your domain and follow DNS instructions.

### Option B — Wrangler CLI

```bash
npm run build
npx wrangler pages deploy dist --project-name dinner-from-fridge
```

Log in with `npx wrangler login` first if needed.

## Features (parity with mobile)

- Onboarding
- Capture: image upload → `/v1/scan` → editable chips, Use soon, tonight filters (15/30, one pan, air fryer, no oven)
- Tonight dinners: D1 `/v1/dinners/match` first, AI `/v1/dinners` if weak
- Recipes search/browse/detail with **scaled ingredient quantities** + sticky Start cook mode + cook steps
- Ask AI recipe lookup (shared quota) + paywall messaging
- Favorites, weekly meal plan (localStorage)
- Nutrition food calc + micros
- Goals / nutrition plan
- Shopping list
- Settings: quota, dietary prefs, about, privacy/terms links

## Growth features

- **Story share cards** (`src/lib/storyCard.ts`, `ShareSheet`): 1080×1920 images drawn on canvas on the device (dish, time, key ingredients, optional fridge photo, logo, site CTA). Share image (Web Share with file) / WhatsApp / copy link / save.
- **Snap your fridge hero + sample fridge** (`/sample-fridge`): static pre-made result in `src/data/sampleFridge.json` — no scan, no free-use quota.
- **Challenge links**: `/challenge?i=eggs,spinach,bell+pepper` (commas between items, `+` between words).
- **Leftover rescue**: `/leftover-rescue?i=…` (`/leftovers` 301s here) — recipes with 2–4 non-staple ingredients.
- **Streaks + savings** (`/streak`): home-cooked dinners in localStorage, weekly streak, estimated savings (default 12/meal, configurable), badge image.
- **Hubs**: `/ramadan`, `/eid`, `/desi`, `/arabic` (`src/lib/hubs.ts`, localized in all 6 languages).
- Catalog-backed pages use `public/catalog-index.json` (refresh with `npm run catalog`). OG cards live in `public/og/` (`npm run og-images`, needs Python + Pillow). `functions/_middleware.ts` serves OG/bot HTML for all of the above plus `/s/…` share links.

## Gaps vs Flutter mobile

- No native camera / ML Kit on-device OCR (web uses file upload + Worker scan only)
- No RevenueCat / real Pro billing (paywall is messaging stub)
- No Hive AI dinner cache / seed-recipe local matcher (web relies on Worker match + AI fallback)
- No push cook notifications or multi-language UI (English only)
- Share sheet / system share not wired

## License

Private / unpublished unless otherwise noted.
