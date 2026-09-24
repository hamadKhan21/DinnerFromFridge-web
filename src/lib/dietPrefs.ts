/** Dietary preference ids — keep in sync with Settings. */
export const DIET_PREF_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'halal',
  'keto',
  'high-protein',
] as const

export type DietPref = (typeof DIET_PREF_OPTIONS)[number]
