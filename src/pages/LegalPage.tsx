import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

const PRIVACY = `Dinner From Fridge — Privacy summary (template)

Last updated: September 16, 2026

This is a plain-language product privacy summary for Dinner From Fridge. It is a template — not legal advice.

What we process
• Fridge / pantry photos you choose to scan, to suggest ingredient chips.
• Ingredient lists, meal preferences, and optional goals you enter.
• An anonymous device id used only to enforce free AI limits on our cloud Worker.
• On-device data such as shopping lists, favorites, and week plans in localStorage.

Where processing happens
• Photos and dinner/Ask AI requests may be sent to our Cloudflare Worker, which may call Google Gemini.
• Catalog search and meal matching use our Worker database.

What we do not do (current build)
• We do not sell your personal data.
• We do not require an account for core free features.
• We do not use your fridge photos for advertising.

Hosted copy: https://tonightfromthis.hamad2k9.workers.dev/privacy`

const TERMS = `Dinner From Fridge — Terms of Use (template)

Last updated: September 16, 2026

This is a simple Terms of Use template. It is not legal advice.

The app helps you turn fridge ingredients into dinner ideas, recipes, cook steps, shopping lists, and optional weekly plans.

Acceptable use
• Personal, non-abusive cooking and meal planning.
• Do not disrupt the service or misuse scan quotas.
• Recipe and nutrition information is approximate — not medical advice.

Hosted copy: https://tonightfromthis.hamad2k9.workers.dev/terms`

export function LegalPage() {
  const { doc } = useParams()
  const isPrivacy = doc !== 'terms'
  return (
    <div>
      <PageHeader title={isPrivacy ? 'Privacy policy' : 'Terms of use'} back />
      <pre className="whitespace-pre-wrap px-5 py-5 text-sm leading-relaxed text-ink">
        {isPrivacy ? PRIVACY : TERMS}
      </pre>
      <p className="px-5 pb-8 text-sm">
        <a
          className="text-terracotta underline"
          href={
            isPrivacy
              ? 'https://tonightfromthis.hamad2k9.workers.dev/privacy'
              : 'https://tonightfromthis.hamad2k9.workers.dev/terms'
          }
          target="_blank"
          rel="noreferrer"
        >
          Open hosted copy
        </a>
      </p>
    </div>
  )
}
