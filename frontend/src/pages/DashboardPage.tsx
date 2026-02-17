import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStatistics } from '../hooks/useStatistics'

function DonutChart({ high, medium, low }: { high: number; medium: number; low: number }) {
  const { t } = useTranslation()
  const total = high + medium + low
  if (total === 0) return null

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const highPct = high / total
  const mediumPct = medium / total
  const lowPct = low / total

  const highOffset = 0
  const mediumOffset = highPct * circumference
  const lowOffset = (highPct + mediumPct) * circumference

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="20" />
          {lowPct > 0 && (
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#10B981" strokeWidth="20"
              strokeDasharray={`${lowPct * circumference} ${circumference}`}
              strokeDashoffset={-lowOffset}
              transform="rotate(-90 80 80)" strokeLinecap="round" />
          )}
          {mediumPct > 0 && (
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#F59E0B" strokeWidth="20"
              strokeDasharray={`${mediumPct * circumference} ${circumference}`}
              strokeDashoffset={-mediumOffset}
              transform="rotate(-90 80 80)" strokeLinecap="round" />
          )}
          {highPct > 0 && (
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#EF4444" strokeWidth="20"
              strokeDasharray={`${highPct * circumference} ${circumference}`}
              strokeDashoffset={-highOffset}
              transform="rotate(-90 80 80)" strokeLinecap="round" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">{t('dashboard.totalRisks')}</span>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-700">HIGH <span className="font-semibold">{high}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-sm text-gray-700">MEDIUM <span className="font-semibold">{medium}</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-700">LOW <span className="font-semibold">{low}</span></span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useStatistics()
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('dashboard.loadError')}</p>
      </div>
    )
  }

  const { totalContracts, totalRisks, risksByLevel, recentContracts } = stats
  const highCount = risksByLevel.high || 0
  const mediumCount = risksByLevel.medium || 0
  const lowCount = risksByLevel.low || 0

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h2>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{t('dashboard.totalContracts')}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalContracts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">HIGH</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{highCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">MEDIUM</p>
          </div>
          <p className="text-3xl font-bold text-amber-500">{mediumCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">LOW</p>
          </div>
          <p className="text-3xl font-bold text-emerald-500">{lowCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('dashboard.riskDistribution')}</h3>
          {totalRisks > 0 ? (
            <DonutChart high={highCount} medium={mediumCount} low={lowCount} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
              </svg>
              <p className="text-sm">{t('dashboard.emptyChart')}</p>
            </div>
          )}
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentAnalysis')}</h3>
            <Link to="/contracts" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
              {t('dashboard.viewAll')} &rarr;
            </Link>
          </div>
          {recentContracts.length > 0 ? (
            <div className="space-y-2">
              {recentContracts.map((contract) => (
                <Link
                  key={contract.id}
                  to={`/result/${contract.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate text-sm group-hover:text-blue-600 transition">
                      {contract.filename}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(contract.createdAt).toLocaleDateString(dateLocale, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-2 py-0.5 text-xs rounded-full font-medium ${
                      contract.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-700'
                        : contract.status === 'ANALYZING'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {contract.status === 'COMPLETED' ? t('dashboard.statusCompleted') : contract.status === 'ANALYZING' ? t('dashboard.statusAnalyzing') : t('dashboard.statusFailed')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              <p className="text-sm">{t('dashboard.emptyRecent')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
