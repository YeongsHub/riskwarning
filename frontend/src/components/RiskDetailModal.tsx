import { useState, useEffect } from 'react'
import type { RiskDetail } from '../types'
import { RISK_COLORS } from '../types'
import { useNegotiationGuide } from '../hooks/useRisks'

interface RiskDetailModalProps {
  risk: RiskDetail | null
  isLoading: boolean
  onClose: () => void
}

type ModalTab = 'detail' | 'negotiation'

export default function RiskDetailModal({
  risk,
  isLoading,
  onClose,
}: RiskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('detail')
  const [guideRequested, setGuideRequested] = useState(false)

  const { data: guide, isLoading: isGuideLoading } = useNegotiationGuide(
    risk?.id ?? null,
    guideRequested
  )

  useEffect(() => {
    setActiveTab('detail')
    setGuideRequested(false)
  }, [risk?.id])

  if (!risk && !isLoading) return null

  const handleTabChange = (tab: ModalTab) => {
    setActiveTab(tab)
    if (tab === 'negotiation' && !guideRequested) {
      setGuideRequested(true)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : risk ? (
          <>
            <div className="flex justify-between items-start mb-4 gap-2">
              <span
                className="px-2 sm:px-3 py-1 text-white text-xs sm:text-sm font-semibold shrink-0"
                style={{ backgroundColor: RISK_COLORS[risk.level] }}
              >
                {risk.level} RISK
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl p-1 -mr-1 -mt-1"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => handleTabChange('detail')}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'detail'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                위험 상세
              </button>
              <button
                onClick={() => handleTabChange('negotiation')}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'negotiation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                협상 가이드
              </button>
            </div>

            {activeTab === 'detail' && (
              <>
                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
                    Risky Clause
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 bg-gray-50 p-2 sm:p-3 break-words">
                    {risk.clause}
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
                    Potential Violation
                  </h3>
                  <p
                    className="text-sm sm:text-lg font-medium p-2 sm:p-3 break-words"
                    style={{
                      backgroundColor: `${RISK_COLORS[risk.level]}15`,
                      color: RISK_COLORS[risk.level],
                    }}
                  >
                    {risk.reason}
                  </p>
                </div>

                {risk.suggestion && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
                      AI 수정 제안
                    </h3>
                    <p className="text-sm sm:text-base text-blue-800 bg-blue-50 border-l-4 border-blue-500 p-2 sm:p-3 break-words">
                      {risk.suggestion}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'negotiation' && (
              <>
                {isGuideLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : guide ? (
                  <div className="space-y-4">
                    {/* Gap perspective (blue) */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">갑 관점</h4>
                      <p className="text-sm text-blue-700 mb-2">{guide.gapPerspective.summary}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {guide.gapPerspective.negotiationPoints.map((point, i) => (
                          <li key={i} className="text-sm text-blue-600">{point}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Eul perspective (orange) */}
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                      <h4 className="text-sm font-semibold text-orange-800 mb-1">을 관점</h4>
                      <p className="text-sm text-orange-700 mb-2">{guide.eulPerspective.summary}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {guide.eulPerspective.negotiationPoints.map((point, i) => (
                          <li key={i} className="text-sm text-orange-600">{point}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Alternative clauses (green) */}
                    {guide.alternativeClauses.length > 0 && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-2">대안 조항</h4>
                        <ul className="space-y-2">
                          {guide.alternativeClauses.map((clause, i) => (
                            <li key={i} className="text-sm text-emerald-700 bg-white p-2 rounded">
                              {clause}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risk if unchanged (red) */}
                    {guide.riskIfUnchanged && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-3">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">미수정시 위험</h4>
                        <p className="text-sm text-red-700">{guide.riskIfUnchanged}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    협상 가이드를 불러올 수 없습니다.
                  </p>
                )}
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
