import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { CapturePage } from './pages/CapturePage'
import { CookOrModePage } from './pages/CookOrModePage'
import { CuisineLandingPage } from './pages/CuisineLandingPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { GoalsPage } from './pages/GoalsPage'
import { HomePage } from './pages/HomePage'
import { IngredientsPage } from './pages/IngredientsPage'
import { LegalPage } from './pages/LegalPage'
import { NutritionPage } from './pages/NutritionPage'
import { PaywallPage } from './pages/PaywallPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { SettingsPage } from './pages/SettingsPage'
import { SharePage } from './pages/SharePage'
import { ShoppingPage } from './pages/ShoppingPage'
import { SuggestionsPage } from './pages/SuggestionsPage'
import { TodayPage } from './pages/TodayPage'
import { WeekPlanPage } from './pages/WeekPlanPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="capture" element={<CapturePage />} />
        <Route path="ingredients" element={<IngredientsPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="recipe/:id" element={<RecipeDetailPage />} />
        <Route path="cook/:id" element={<CookOrModePage />} />
        <Route path="cuisine/:slug" element={<CuisineLandingPage />} />
        <Route path="s/:payload" element={<SharePage />} />
        <Route path="share/:payload" element={<SharePage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="week-plan" element={<WeekPlanPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="paywall" element={<PaywallPage />} />
        <Route path="legal/:doc" element={<LegalPage />} />
      </Route>
      <Route path="onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
