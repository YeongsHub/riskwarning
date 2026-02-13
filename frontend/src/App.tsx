import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
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
      className={`text-sm px-3 py-1 rounded ${
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  )
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  EarlyWarning
                </h1>
                <p className="text-sm text-gray-500">Contract Risk Detection</p>
              </div>
              <nav className="flex gap-1">
                <NavLink to="/">새 분석</NavLink>
                <NavLink to="/dashboard">대시보드</NavLink>
                <NavLink to="/contracts">분석 이력</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <AlertBell />
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={isAuthenticated ? "max-w-4xl mx-auto px-4 py-8" : ""}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <ContractsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result/:contractId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
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
