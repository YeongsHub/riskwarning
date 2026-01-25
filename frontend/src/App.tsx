import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">
              ⚠️ EarlyWarning
            </h1>
            <p className="text-sm text-gray-500">Contract Risk Detection</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/result/:contractId" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App