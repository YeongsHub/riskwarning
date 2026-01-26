import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import RiskList from '../components/RiskList'
import RiskDetailModal from '../components/RiskDetailModal'
import { useRisks, useRiskDetail } from '../hooks/useRisks'

export default function ResultPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null)

  const { data: risks, isLoading, isError } = useRisks(Number(contractId))
  const { data: riskDetail, isLoading: isDetailLoading } = useRiskDetail(selectedRiskId)

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
        <p className="text-red-600 mb-4">Failed to load risk information.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Upload Again
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
          <p className="text-gray-600">
            {risks?.length || 0} risk(s) detected.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Analyze New Contract
        </Link>
      </div>

      {risks && (
        <RiskList risks={risks} onRiskClick={(id) => setSelectedRiskId(id)} />
      )}

      <RiskDetailModal
        risk={riskDetail || null}
        isLoading={isDetailLoading}
        onClose={() => setSelectedRiskId(null)}
      />
    </div>
  )
}