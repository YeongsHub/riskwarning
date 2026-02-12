import { Link } from 'react-router-dom'
import { useContracts, useDeleteContract } from '../hooks/useContracts'

export default function ContractsPage() {
  const { data: contracts, isLoading, isError } = useContracts()
  const deleteMutation = useDeleteContract()

  const handleDelete = (id: number, filename: string) => {
    if (window.confirm(`"${filename}"을(를) 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load contracts.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">분석 이력</h2>
          <p className="text-gray-600">
            총 {contracts?.length || 0}건의 계약서가 분석되었습니다.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          새 분석
        </Link>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <Link
                  to={`/result/${contract.id}`}
                  className="flex-1 min-w-0"
                >
                  <h3 className="font-medium text-gray-900 truncate">
                    {contract.filename}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(contract.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {contract.status === 'ANALYZING' && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      분석 중...
                    </span>
                  )}
                  {contract.status === 'FAILED' && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      분석 실패
                    </span>
                  )}
                  {contract.status === 'COMPLETED' && (
                    <div className="flex gap-2 mt-2">
                      {contract.riskSummary.high > 0 && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          HIGH: {contract.riskSummary.high}
                        </span>
                      )}
                      {contract.riskSummary.medium > 0 && (
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">
                          MEDIUM: {contract.riskSummary.medium}
                        </span>
                      )}
                      {contract.riskSummary.low > 0 && (
                        <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
                          LOW: {contract.riskSummary.low}
                        </span>
                      )}
                      {contract.riskSummary.high === 0 &&
                        contract.riskSummary.medium === 0 &&
                        contract.riskSummary.low === 0 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            위험 없음
                          </span>
                        )}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => handleDelete(contract.id, contract.filename)}
                  disabled={deleteMutation.isPending}
                  className="ml-4 text-sm text-gray-400 hover:text-red-500 shrink-0"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>분석된 계약서가 없습니다.</p>
          <Link to="/" className="text-blue-500 hover:underline mt-2 inline-block">
            첫 계약서를 분석해보세요
          </Link>
        </div>
      )}
    </div>
  )
}
