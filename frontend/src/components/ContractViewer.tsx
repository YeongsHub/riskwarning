import { useMemo } from 'react'
import type { Risk, RiskLevel } from '../types'

interface ContractViewerProps {
  content: string
  risks: Risk[]
  onRiskClick: (riskId: number) => void
}

interface Segment {
  text: string
  risk?: Risk
}

const HIGHLIGHT_STYLES: Record<RiskLevel, { bg: string; border: string }> = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' },
  LOW: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981' },
}

const LEVEL_PRIORITY: Record<RiskLevel, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

export default function ContractViewer({ content, risks, onRiskClick }: ContractViewerProps) {
  const segments = useMemo(() => {
    if (!content || risks.length === 0) {
      return [{ text: content }] as Segment[]
    }

    // Find positions of each risk clause in the content
    const matches: { start: number; end: number; risk: Risk }[] = []
    for (const risk of risks) {
      const idx = content.indexOf(risk.clause)
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + risk.clause.length, risk })
      }
    }

    if (matches.length === 0) {
      return [{ text: content }] as Segment[]
    }

    // Sort by start position
    matches.sort((a, b) => a.start - b.start)

    // Resolve overlaps: higher risk level takes priority
    const resolved: typeof matches = []
    for (const match of matches) {
      const last = resolved[resolved.length - 1]
      if (last && match.start < last.end) {
        // Overlap: keep the one with higher priority (lower number)
        if (LEVEL_PRIORITY[match.risk.level] < LEVEL_PRIORITY[last.risk.level]) {
          resolved[resolved.length - 1] = match
        }
        // Otherwise skip this match
      } else {
        resolved.push(match)
      }
    }

    // Build segments
    const result: Segment[] = []
    let cursor = 0
    for (const match of resolved) {
      if (match.start > cursor) {
        result.push({ text: content.slice(cursor, match.start) })
      }
      result.push({ text: content.slice(match.start, match.end), risk: match.risk })
      cursor = match.end
    }
    if (cursor < content.length) {
      result.push({ text: content.slice(cursor) })
    }

    return result
  }, [content, risks])

  return (
    <div className="bg-white border border-gray-200 p-4 sm:p-6 text-sm leading-relaxed whitespace-pre-wrap font-mono">
      {segments.map((segment, i) =>
        segment.risk ? (
          <span
            key={i}
            data-risk-id={segment.risk.id}
            onClick={() => onRiskClick(segment.risk!.id)}
            className="cursor-pointer transition-opacity hover:opacity-80"
            style={{
              backgroundColor: HIGHLIGHT_STYLES[segment.risk.level].bg,
              borderBottom: `2px solid ${HIGHLIGHT_STYLES[segment.risk.level].border}`,
              padding: '1px 0',
            }}
            title={`${segment.risk.level} RISK - Click for details`}
          >
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </div>
  )
}
