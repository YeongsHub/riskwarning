import type { Risk } from '../types'
import { RISK_COLORS } from '../types'

interface RiskHeatmapProps {
  content: string
  risks: Risk[]
  onSegmentClick: (riskId: number) => void
}

export default function RiskHeatmap({ content, risks, onSegmentClick }: RiskHeatmapProps) {
  if (!content || risks.length === 0) return null

  const markers = risks
    .map((risk) => {
      const idx = content.indexOf(risk.clause)
      if (idx === -1) return null
      const percent = (idx / content.length) * 100
      return { risk, percent }
    })
    .filter(Boolean) as { risk: Risk; percent: number }[]

  if (markers.length === 0) return null

  return (
    <div className="relative w-3 bg-gray-100 rounded shrink-0" style={{ minHeight: '100%' }}>
      {markers.map((marker) => (
        <button
          key={marker.risk.id}
          onClick={() => onSegmentClick(marker.risk.id)}
          className="absolute w-3 h-2 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            top: `${marker.percent}%`,
            backgroundColor: RISK_COLORS[marker.risk.level],
          }}
          title={`${marker.risk.level} RISK`}
        />
      ))}
    </div>
  )
}
