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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : risk ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: RISK_COLORS[risk.level] }}
              >
                {risk.level} RISK
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                Risky Clause
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {risk.clause}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                Potential Violation
              </h3>
              <p
                className="text-lg font-medium p-3 rounded"
                style={{
                  backgroundColor: `${RISK_COLORS[risk.level]}15`,
                  color: RISK_COLORS[risk.level],
                }}
              >
                {risk.reason}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}