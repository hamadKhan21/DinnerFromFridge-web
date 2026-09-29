import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { CapturePage } from './pages/CapturePage'
import { ChallengePage } from './pages/ChallengePage'
import { HubPage } from './pages/HubPage'
import { LeftoversPage } from './pages/LeftoversPage'
import { SampleFridgePage } from './pages/SampleFridgePage'
import { StreakPage } from './pages/StreakPage'
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
        <Route path="sample-fridge" element={<SampleFridgePage />} />
        <Route path="challenge" element={<ChallengePage />} />
        <Route path="leftover-rescue" element={<LeftoversPage />} />
        <Route path="leftovers" element={<LeftoversRedirect />} />
        <Route path="streak" element={<StreakPage />} />
        <Route path="ramadan" element={<HubPage key="ramadan" slug="ramadan" />} />
        <Route path="eid" element={<HubPage key="eid" slug="eid" />} />
        <Route path="desi" element={<HubPage key="desi" slug="desi" />} />
        <Route path="arabic" element={<HubPage key="arabic" slug="arabic" />} />
      </Route>
      <Route path="onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** /leftovers → /leftover-rescue (keeps ?i=…) */
function LeftoversRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/leftover-rescue${search}`} replace />
}
