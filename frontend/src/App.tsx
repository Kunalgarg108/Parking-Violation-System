import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApiClient'
import Navigation from './components/shared/Navigation'
import DashboardPage from './pages/DashboardPage'
import RiskMapPage from './pages/RiskMapPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RepeatOffendersPage from './pages/RepeatOffendersPage'
import PatrolPlannerPage from './pages/PatrolPlannerPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<RiskMapPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/repeat-offenders" element={<RepeatOffendersPage />} />
            <Route path="/patrol" element={<PatrolPlannerPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
