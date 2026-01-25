import type { Risk } from '../types'
import RiskCard from './RiskCard'

interface RiskListProps {
  risks: Risk[]
  onRiskClick: (riskId: number) => void
}

export default function RiskList({ risks, onRiskClick }: RiskListProps) {
  const highRisks = risks.filter((r) => r.level === 'HIGH')
  const mediumRisks = risks.filter((r) => r.level === 'MEDIUM')
  const lowRisks = risks.filter((r) => r.level === 'LOW')

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
          HIGH: {highRisks.length}
        </span>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
          MEDIUM: {mediumRisks.length}
        </span>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
          LOW: {lowRisks.length}
        </span>
      </div>

      <div className="space-y-3">
        {risks.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onClick={() => onRiskClick(risk.id)}
          />
        ))}
      </div>

      {risks.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          탐지된 리스크가 없습니다.
        </p>
      )}
    </div>
  )
}