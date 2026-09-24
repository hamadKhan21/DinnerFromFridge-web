export const COOK_TIME_LANDINGS = [
  { slug: '15-min', maxMinutes: 15, label: '15-minute dinners', intro: 'Fast dinners you can cook in about 15 minutes or less — perfect for busy weeknights.' },
  { slug: '20-min', maxMinutes: 20, label: '20-minute dinners', intro: 'Quick meals ready in about 20 minutes. Great when you want dinner without the wait.' },
  { slug: '30-min', maxMinutes: 30, label: '30-minute dinners', intro: 'Weeknight-friendly recipes ready in about 30 minutes from prep to plate.' },
  { slug: '45-min', maxMinutes: 45, label: '45-minute dinners', intro: 'Heartier dinners that still fit a busy evening — about 45 minutes or less.' },
] as const

export const CUISINE_LANDINGS = [
  { slug: 'desi', label: 'Desi / South Asian', keywords: ['desi', 'indian', 'pakistani', 'south asian', 'curry'], intro: 'Desi and South Asian dinner ideas — curries, dals, rice dishes, and more from your fridge.' },
  { slug: 'arabic', label: 'Arabic / Middle Eastern', keywords: ['arabic', 'middle eastern', 'levantine', 'mediterranean'], intro: 'Arabic and Middle Eastern dinners — fragrant, shareable plates you can cook at home.' },
  { slug: 'chinese', label: 'Chinese', keywords: ['chinese', 'stir fry', 'stir-fry', 'wok'], intro: 'Chinese-inspired dinners — stir-fries and pantry-friendly meals for tonight.' },
  { slug: 'western', label: 'Western', keywords: ['western', 'american', 'italian', 'european'], intro: 'Western dinner classics — pasta, skillet meals, and familiar comfort food.' },
  { slug: 'mexican', label: 'Mexican', keywords: ['mexican', 'tex-mex', 'taco', 'burrito'], intro: 'Mexican and Tex-Mex dinner ideas — tacos, bowls, and weeknight favorites.' },
] as const

export function cookLandingBySlug(slug: string) {
  return COOK_TIME_LANDINGS.find((c) => c.slug === slug)
}

export function cuisineLandingBySlug(slug: string) {
  return CUISINE_LANDINGS.find((c) => c.slug === slug)
}
