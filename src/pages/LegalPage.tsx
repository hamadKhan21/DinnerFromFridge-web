import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useI18n } from '../i18n/I18nContext'

const PRIVACY = `Dinner From Fridge — Privacy summary

Last updated: September 16, 2026

This is a plain-language product privacy summary for Dinner From Fridge. It is a template — not legal advice.

What we process
• Fridge / pantry photos you choose to scan, to suggest ingredient chips.
• Ingredient lists, meal preferences, and optional goals you enter.
• An anonymous device identifier used only to enforce free scan limits.
• On-device data such as shopping lists, favorites, and week plans stored in your browser.

Where processing happens
• Photo scans may be processed to suggest ingredients.
• Smart recipe lookup and dinner suggestions may be processed when you use those features.
• Recipe browsing and meal matching use our product catalog.

What we do not do (current build)
• We do not sell your personal data.
• We do not require an account for core free features.
• We do not use your fridge photos for advertising.

Prefer manual entry if you don’t want to upload photos.`

const TERMS = `Dinner From Fridge — Terms of Use

Last updated: September 16, 2026

This is a simple Terms of Use template. It is not legal advice.

The app helps you turn fridge ingredients into dinner ideas, recipes, cook steps, shopping lists, and optional weekly plans.

Acceptable use
• Personal, non-abusive cooking and meal planning.
• Do not disrupt the service or misuse free scan quotas.
• Recipe and nutrition information is approximate — not medical advice.`

export function LegalPage() {
  const { doc } = useParams()
  const { t } = useI18n()
  const isPrivacy = doc !== 'terms'
  return (
    <div>
      <PageHeader title={isPrivacy ? t('legal.privacyTitle') : t('legal.termsTitle')} back />
      <pre className="whitespace-pre-wrap px-5 py-5 text-sm leading-relaxed text-ink">
        {isPrivacy ? PRIVACY : TERMS}
      </pre>
    </div>
  )
}
