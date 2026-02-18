import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '../api/client'
import type { AnalysisProgress } from '../types'

export function useAnalysisProgress(contractId: number, enabled: boolean) {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled || !contractId) return

    const abortController = new AbortController()
    abortRef.current = abortController

    async function connect() {
      try {
        const apiBase = (window as any).__RUNTIME_CONFIG__?.API_BASE || '/api'
        const response = await fetch(`${apiBase}/contracts/${contractId}/progress`, {
          headers: {
            ...getAuthHeaders(),
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) return

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data: AnalysisProgress = JSON.parse(line.slice(5))
                setProgress(data)

                if (data.step === 'COMPLETED') {
                  setIsComplete(true)
                  queryClient.invalidateQueries({ queryKey: ['risks', contractId] })
                  queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
                  queryClient.invalidateQueries({ queryKey: ['contracts'] })
                }

                if (data.step === 'FAILED') {
                  setIsComplete(true)
                  queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
                }
              } catch {
                // skip malformed data
              }
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error('SSE connection error:', e)
        }
      }
    }

    connect()

    return () => {
      abortController.abort()
    }
  }, [contractId, enabled, queryClient])

  return { progress, isComplete }
}
