import { useTranslation } from 'react-i18next'
import type { Risk } from '../types'
import { RISK_COLORS } from '../types'

interface RiskCardProps {
  risk: Risk
  onClick: () => void
}

export default function RiskCard({ risk, onClick }: RiskCardProps) {
  const { t } = useTranslation()

  const levelLabel = {
    HIGH: 'HIGH RISK',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  }

  const bgColors = {
    HIGH: 'bg-red-50',
    MEDIUM: 'bg-amber-50',
    LOW: 'bg-emerald-50',
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${bgColors[risk.level]}`}
      style={{ borderLeftColor: RISK_COLORS[risk.level] }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: RISK_COLORS[risk.level] }}
        >
          {levelLabel[risk.level]}
        </span>
        <span className="text-xs text-gray-400">{t('riskCard.viewDetail')} &rarr;</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">{risk.clause}</p>
    </div>
  )
}
