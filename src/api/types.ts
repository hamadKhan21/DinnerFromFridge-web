export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Ingredient {
  name: string
  quantity?: string | null
  unit?: string | null
  useSoon?: boolean
}

export interface CookStep {
  instruction: string
  timerSeconds?: number | null
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  sugar?: number | null
  sodium?: number | null
  source?: string | null
  perServing?: boolean
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  steps: CookStep[]
  prepMinutes: number
  cookMinutes: number
  servings: number
  difficulty: Difficulty
  tags: string[]
  emoji: string
  nutrition?: NutritionInfo | null
}

export interface MealMatch {
  recipe: Recipe
  have: Ingredient[]
  missing: Ingredient[]
  score: number
  useSoonCount?: number
}

export interface TonightFilters {
  maxMinutes?: number | null
  onePan?: boolean
  airFryer?: boolean
  noOven?: boolean
}

export interface CloudQuota {
  remaining: number
  used: number
  limit: number
  isPro: boolean
}

export interface CloudScanResult {
  ingredients: Ingredient[]
  remaining: number
  used: number
  limit: number
  note: string
  isPro: boolean
}

export interface MicroNutrient {
  key: string
  label: string
  unit: string
  amount: number
  per100g?: number | null
}

export interface FoodItem {
  id: string
  name: string
  cal100: number
  protein100: number
  carbs100: number
  fat100: number
  fiber100?: number | null
  sodium100?: number | null
  unit: string
  vitaminCMg?: number | null
  vitaminARae?: number | null
  vitaminDUg?: number | null
  vitaminB12Ug?: number | null
  folateUg?: number | null
  calciumMg?: number | null
  ironMg?: number | null
  magnesiumMg?: number | null
  potassiumMg?: number | null
  zincMg?: number | null
  aliases?: string[]
  tags?: string[]
  source?: string | null
}

export interface FoodNutritionResult {
  food: FoodItem
  grams: number
  micronutrients: MicroNutrient[]
}

export interface WeekPlanDay {
  dayIndex: number
  dayLabel: string
  dinner: Recipe
  breakfast?: Recipe | null
  lunch?: Recipe | null
  dinnerHave?: Ingredient[]
  dinnerMissing?: Ingredient[]
}

export interface WeekPlan {
  days: WeekPlanDay[]
  missingIngredients: string[]
  source: string
  generatedAtMillis?: number | null
  calorieTarget?: number | null
  proteinG?: number | null
  preferences?: string[]
}

export interface DietPlanMeal {
  slot: string
  title: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  sodium?: number | null
  recipeId?: string | null
  emoji?: string | null
  notes?: string | null
}

export interface DietPlan {
  calorieTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  meals: DietPlanMeal[]
  notes?: string | null
  source?: string | null
}

export interface FatLossGoal {
  weightKg: number
  goalWeightKg: number
  heightCm?: number | null
  age?: number | null
  sex?: string | null
  activity: string
  unitSystem: string
  updatedAtMillis?: number | null
}

export interface ShoppingItem {
  id: string
  name: string
  checked: boolean
  quantity?: string | null
  unit?: string | null
}

export interface FavoriteRecipe {
  recipe: Recipe
  savedAtMillis: number
}

export class PaywallError extends Error {
  remaining: number
  constructor(message = 'Free AI limit reached', remaining = 0) {
    super(message)
    this.name = 'PaywallError'
    this.remaining = remaining
  }
}

export const FREE_AI_LIMIT = 3
