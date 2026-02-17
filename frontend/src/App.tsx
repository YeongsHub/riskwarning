import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './i18n'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import UploadPage from './pages/UploadPage'
import ResultPage from './pages/ResultPage'
import ContractsPage from './pages/ContractsPage'
import DashboardPage from './pages/DashboardPage'
import AlertsPage from './pages/AlertsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AlertBell from './components/AlertBell'

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link
      to={to}
      className={`text-sm px-3 py-1.5 rounded-lg transition ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}

function LanguageToggle() {
  const { i18n } = useTranslation()
  const toggleLanguage = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }
  return (
    <button
      onClick={toggleLanguage}
      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition font-medium"
    >
      {i18n.language === 'ko' ? 'EN' : 'KO'}
    </button>
  )
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">EarlyWarning</h1>
                </div>
              </Link>
              <nav className="flex gap-1">
                <NavLink to="/">{t('nav.newAnalysis')}</NavLink>
                <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>
                <NavLink to="/contracts">{t('nav.contracts')}</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <AlertBell />
              <div className="h-4 w-px bg-gray-200" />
              <LanguageToggle />
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={isAuthenticated ? "max-w-5xl mx-auto px-4 py-8" : ""}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/result/:contractId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
