import type { Risk } from '../types'
import { RISK_COLORS } from '../types'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractWords(s: string): string[] {
  return s.match(/[\w\uAC00-\uD7A3\u3131-\u3163\u1100-\u11FF\u3400-\u9FFF]+/g) || []
}

function findClauseIndex(content: string, clause: string): number {
  const exactIdx = content.indexOf(clause)
  if (exactIdx !== -1) return exactIdx

  const words = extractWords(clause)
  if (words.length < 2) return -1

  const searchCount = Math.min(words.length, 6)
  const pattern = words.slice(0, searchCount).map(w => escapeRegex(w)).join('[\\s\\S]{0,30}?')
  try {
    const re = new RegExp(pattern)
    const match = re.exec(content)
    return match ? match.index : -1
  } catch {
    return -1
  }
}

interface RiskHeatmapProps {
  content: string
  risks: Risk[]
  onSegmentClick: (riskId: number) => void
}

export default function RiskHeatmap({ content, risks, onSegmentClick }: RiskHeatmapProps) {
  if (!content || risks.length === 0) return null

  const markers = risks
    .map((risk) => {
      const idx = findClauseIndex(content, risk.clause)
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
