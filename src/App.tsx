import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useApp } from './context/AppContext'
import { CapturePage } from './pages/CapturePage'
import { CookModePage } from './pages/CookModePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { GoalsPage } from './pages/GoalsPage'
import { HomePage } from './pages/HomePage'
import { IngredientsPage } from './pages/IngredientsPage'
import { LegalPage } from './pages/LegalPage'
import { NutritionPage } from './pages/NutritionPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PaywallPage } from './pages/PaywallPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipesPage } from './pages/RecipesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { SuggestionsPage } from './pages/SuggestionsPage'
import { WeekPlanPage } from './pages/WeekPlanPage'

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { onboardingDone } = useApp()
  if (!onboardingDone) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        element={
          <RequireOnboarding>
            <Layout />
          </RequireOnboarding>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="capture" element={<CapturePage />} />
        <Route path="ingredients" element={<IngredientsPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="recipe/:id" element={<RecipeDetailPage />} />
        <Route path="cook/:id" element={<CookModePage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="week-plan" element={<WeekPlanPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="paywall" element={<PaywallPage />} />
        <Route path="legal/:doc" element={<LegalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
