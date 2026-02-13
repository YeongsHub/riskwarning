import { Link } from 'react-router-dom'
import { useStatistics } from '../hooks/useStatistics'

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useStatistics()

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
        <p className="text-red-600">통계를 불러오지 못했습니다.</p>
      </div>
    )
  }

  const { totalContracts, totalRisks, risksByLevel, recentContracts } = stats
  const highCount = risksByLevel.high || 0
  const mediumCount = risksByLevel.medium || 0
  const lowCount = risksByLevel.low || 0
  const riskTotal = highCount + mediumCount + lowCount

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
        <p className="text-gray-600">전체 계약서의 위험 통계를 한눈에 확인하세요.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">총 계약서</p>
          <p className="text-3xl font-bold text-gray-900">{totalContracts}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">총 위험 항목</p>
          <p className="text-3xl font-bold text-gray-900">{totalRisks}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">HIGH</p>
          <p className="text-3xl font-bold text-red-600">{highCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">MEDIUM</p>
          <p className="text-3xl font-bold text-amber-500">{mediumCount}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">LOW</p>
          <p className="text-3xl font-bold text-emerald-500">{lowCount}</p>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">위험 수준 분포</h3>
        {riskTotal > 0 ? (
          <>
            <div className="flex h-8 rounded overflow-hidden mb-3">
              {highCount > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${(highCount / riskTotal) * 100}%` }}
                />
              )}
              {mediumCount > 0 && (
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${(mediumCount / riskTotal) * 100}%` }}
                />
              )}
              {lowCount > 0 && (
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${(lowCount / riskTotal) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-gray-600">HIGH: {highCount}건</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="text-gray-600">MEDIUM: {mediumCount}건</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-gray-600">LOW: {lowCount}건</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">아직 분석된 위험 항목이 없습니다.</p>
        )}
      </div>

      {/* Recent Contracts */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">최근 분석</h3>
          <Link to="/contracts" className="text-sm text-blue-500 hover:underline">
            전체 보기
          </Link>
        </div>
        {recentContracts.length > 0 ? (
          <div className="space-y-3">
            {recentContracts.map((contract) => (
              <Link
                key={contract.id}
                to={`/result/${contract.id}`}
                className="block p-3 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {contract.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(contract.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-2 py-1 text-xs rounded shrink-0 ${
                      contract.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : contract.status === 'ANALYZING'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {contract.status === 'COMPLETED'
                      ? '완료'
                      : contract.status === 'ANALYZING'
                      ? '분석 중'
                      : '실패'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">아직 분석된 계약서가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
