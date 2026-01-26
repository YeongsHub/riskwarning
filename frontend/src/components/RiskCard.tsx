import type { Risk } from '../types'
import { RISK_BG_COLORS } from '../types'

interface RiskCardProps {
  risk: Risk
  onClick: () => void
}

export default function RiskCard({ risk, onClick }: RiskCardProps) {
  const levelLabel = {
    HIGH: '🔴 HIGH RISK',
    MEDIUM: '🟡 MEDIUM',
    LOW: '🟢 LOW',
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border-l-4 cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${RISK_BG_COLORS[risk.level]}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold">
          {levelLabel[risk.level]}
        </span>
        <span className="text-xs text-gray-500">Click for details</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">{risk.clause}</p>
    </div>
  )
}