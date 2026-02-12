import type { RiskDetail } from '../types'
import { RISK_COLORS } from '../types'

interface RiskDetailModalProps {
  risk: RiskDetail | null
  isLoading: boolean
  onClose: () => void
}

export default function RiskDetailModal({
  risk,
  isLoading,
  onClose,
}: RiskDetailModalProps) {
  if (!risk && !isLoading) return null

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
        ) : null}
      </div>
    </div>
  )
}
