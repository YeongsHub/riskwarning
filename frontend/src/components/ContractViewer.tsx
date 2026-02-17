import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractWords(s: string): string[] {
  return s.match(/[\w\uAC00-\uD7A3\u3131-\u3163\u1100-\u11FF\u3400-\u9FFF]+/g) || []
}

function findClausePosition(content: string, clause: string): { start: number; end: number } | null {
  // 1) Exact match
  const exactIdx = content.indexOf(clause)
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + clause.length }
  }

  // 2) Word-based fuzzy match — extract meaningful words and search in sequence
  const words = extractWords(clause)
  if (words.length < 2) return null

  // Use first N words to locate start, full words to determine range
  const searchCount = Math.min(words.length, 6)
  const startWords = words.slice(0, searchCount)

  // Build regex: words in sequence, with flexible gap (whitespace + punctuation) between them
  const pattern = startWords.map(w => escapeRegex(w)).join('[\\s\\S]{0,30}?')
  try {
    const re = new RegExp(pattern)
    const match = re.exec(content)
    if (!match) return null

    const start = match.index

    // Now find end — use last few words to find the tail
    if (words.length > searchCount) {
      const endWords = words.slice(-Math.min(words.length, 6))
      const endPattern = endWords.map(w => escapeRegex(w)).join('[\\s\\S]{0,30}?')
      const endRe = new RegExp(endPattern, 'g')
      let endMatch: RegExpExecArray | null = null
      let m: RegExpExecArray | null
      while ((m = endRe.exec(content)) !== null) {
        if (m.index >= start) {
          endMatch = m
          break
        }
      }
      if (endMatch) {
        return { start, end: endMatch.index + endMatch[0].length }
      }
    }

    return { start, end: start + match[0].length }
  } catch {
    return null
  }
}

export default function ContractViewer({ content, risks, onRiskClick }: ContractViewerProps) {
  const { t } = useTranslation()
  const { segments, unmatchedRisks } = useMemo(() => {
    if (!content || risks.length === 0) {
      return { segments: [{ text: content }] as Segment[], unmatchedRisks: [] as Risk[] }
    }

    // Find positions of each risk clause in the content
    const matches: { start: number; end: number; risk: Risk }[] = []
    const matchedIds = new Set<number>()
    for (const risk of risks) {
      const pos = findClausePosition(content, risk.clause)
      if (pos) {
        matches.push({ start: pos.start, end: pos.end, risk })
        matchedIds.add(risk.id)
      }
    }

    const unmatched = risks.filter((r) => !matchedIds.has(r.id))

    if (matches.length === 0) {
      return { segments: [{ text: content }] as Segment[], unmatchedRisks: unmatched }
    }

    // Sort by start position
    matches.sort((a, b) => a.start - b.start)

    // Resolve overlaps: higher risk level takes priority
    const resolved: typeof matches = []
    for (const match of matches) {
      const last = resolved[resolved.length - 1]
      if (last && match.start < last.end) {
        if (LEVEL_PRIORITY[match.risk.level] < LEVEL_PRIORITY[last.risk.level]) {
          resolved[resolved.length - 1] = match
        }
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

    return { segments: result, unmatchedRisks: unmatched }
  }, [content, risks])

  const levelLabel: Record<RiskLevel, string> = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' }

  return (
    <div>
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

      {unmatchedRisks.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500">{t('contractViewer.unmatchedRisks', { count: unmatchedRisks.length })}</p>
          {unmatchedRisks.map((risk) => (
            <div
              key={risk.id}
              data-risk-id={risk.id}
              onClick={() => onRiskClick(risk.id)}
              className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-all border-l-4"
              style={{
                backgroundColor: HIGHLIGHT_STYLES[risk.level].bg,
                borderLeftColor: HIGHLIGHT_STYLES[risk.level].border,
              }}
            >
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: HIGHLIGHT_STYLES[risk.level].border }}
              >
                {levelLabel[risk.level]}
              </span>
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{risk.clause}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
