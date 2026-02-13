import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import RiskList from '../components/RiskList'
import RiskDetailModal from '../components/RiskDetailModal'
import ContractViewer from '../components/ContractViewer'
import RiskHeatmap from '../components/RiskHeatmap'
import AnalysisProgress from '../components/AnalysisProgress'
import { useRisks, useRiskDetail } from '../hooks/useRisks'
import { useContract } from '../hooks/useContracts'
import { useAnalysisProgress } from '../hooks/useAnalysisProgress'
import { useReanalyze } from '../hooks/useReanalyze'
import { downloadReport } from '../api/client'

type Tab = 'risks' | 'document'

export default function ResultPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const id = Number(contractId)
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('risks')
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: contract } = useContract(id)
  const reanalyzeMutation = useReanalyze()
  const isAnalyzing = contract?.status === 'ANALYZING'
  const isFailed = contract?.status === 'FAILED'

  const handleReanalyze = () => {
    if (window.confirm('최신 규제 DB로 재분석하시겠습니까?')) {
      reanalyzeMutation.mutate(id)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      await downloadReport(id)
    } catch {
      alert('PDF 리포트 다운로드에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }

  const { progress, isComplete } = useAnalysisProgress(id, isAnalyzing)
  const { data: risks, isLoading, isError } = useRisks(id, !isAnalyzing || isComplete)
  const { data: riskDetail, isLoading: isDetailLoading } = useRiskDetail(selectedRiskId)

  if (isAnalyzing && !isComplete) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">분석 진행 중</h2>
          <Link
            to="/contracts"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            분석 이력
          </Link>
        </div>
        <AnalysisProgress progress={progress} />
      </div>
    )
  }

  if (isFailed) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">분석에 실패했습니다.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzeMutation.isPending}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
          >
            {reanalyzeMutation.isPending ? '재분석 시작 중...' : '재분석'}
          </button>
          <Link to="/" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
            다시 업로드
          </Link>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-gray-900">분석 결과</h2>
          <p className="text-gray-500">
            총 {risks?.length || 0}건의 위험이 감지되었습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isDownloading ? '다운로드 중...' : 'PDF 리포트'}
          </button>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzeMutation.isPending}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
          >
            {reanalyzeMutation.isPending ? '재분석 시작 중...' : '재분석'}
          </button>
          <Link
            to="/contracts"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            분석 이력
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            새 분석
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('risks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'risks'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          위험 목록
        </button>
        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'document'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          문서 뷰
        </button>
      </div>

      {activeTab === 'risks' && risks && (
        <RiskList risks={risks} onRiskClick={(id) => setSelectedRiskId(id)} />
      )}

      {activeTab === 'document' && contract?.content && risks && (
        <div className="flex gap-2">
          <RiskHeatmap
            content={contract.content}
            risks={risks}
            onSegmentClick={(riskId) => {
              const el = document.querySelector(`[data-risk-id="${riskId}"]`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />
          <div className="flex-1 max-h-[70vh] overflow-y-auto">
            <ContractViewer
              content={contract.content}
              risks={risks}
              onRiskClick={(id) => setSelectedRiskId(id)}
            />
          </div>
        </div>
      )}

      <RiskDetailModal
        risk={riskDetail || null}
        isLoading={isDetailLoading}
        onClose={() => setSelectedRiskId(null)}
      />
    </div>
  )
}
