import { useQuery } from '@tanstack/react-query'
import { getRisks, getRiskDetail } from '../api/client'

export function useRisks(contractId: number) {
  return useQuery({
    queryKey: ['risks', contractId],
    queryFn: () => getRisks(contractId),
    enabled: !!contractId,
  })
}

export function useRiskDetail(riskId: number | null) {
  return useQuery({
    queryKey: ['risk', riskId],
    queryFn: () => getRiskDetail(riskId!),
    enabled: !!riskId,
  })
}