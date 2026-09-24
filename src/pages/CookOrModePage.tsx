import { useParams } from 'react-router-dom'
import { cookLandingBySlug } from '../lib/seoLandings'
import { CookLandingPage } from './CookLandingPage'
import { CookModePage } from './CookModePage'

/** `/cook/:id` — SEO time landings (15-min, …) or cook-mode for a recipe id. */
export function CookOrModePage() {
  const { id = '' } = useParams()
  if (cookLandingBySlug(id)) return <CookLandingPage />
  return <CookModePage />
}
