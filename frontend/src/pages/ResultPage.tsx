import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const { data: contract } = useContract(id)
  const reanalyzeMutation = useReanalyze()
  const isAnalyzing = contract?.status === 'ANALYZING'
  const isFailed = contract?.status === 'FAILED'

  const handleReanalyze = () => {
    if (window.confirm(t('result.confirmReanalyze'))) {
      reanalyzeMutation.mutate(id)
    }
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      await downloadReport(id)
    } catch {
      alert(t('result.downloadError'))
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
          <h2 className="text-2xl font-bold text-gray-900">{t('result.analyzingTitle')}</h2>
          <Link
            to="/contracts"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {t('result.contracts')}
          </Link>
        </div>
        <AnalysisProgress progress={progress} />
      </div>
    )
  }

  if (isFailed) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{t('result.failedMessage')}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzeMutation.isPending}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
          >
            {reanalyzeMutation.isPending ? t('result.reanalyzing') : t('result.reanalyze')}
          </button>
          <Link to="/" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
            {t('result.reupload')}
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
        <p className="text-red-600 mb-4">{t('result.loadError')}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          {t('result.uploadAgain')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('result.title')}</h2>
          <p className="text-gray-500">
            {t('result.riskCount', { count: risks?.length || 0 })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isDownloading ? t('result.downloading') : t('result.downloadPdf')}
          </button>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzeMutation.isPending}
            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50"
          >
            {reanalyzeMutation.isPending ? t('result.reanalyzing') : t('result.reanalyze')}
          </button>
          <Link
            to="/contracts"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {t('result.contracts')}
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {t('result.newAnalysis')}
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
          {t('result.tabRisks')}
        </button>
        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'document'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('result.tabDocument')}
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
