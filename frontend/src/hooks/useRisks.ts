import { useQuery } from '@tanstack/react-query'
import { getRisks, getRiskDetail, getNegotiationGuide } from '../api/client'

export function useRisks(contractId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['risks', contractId],
    queryFn: () => getRisks(contractId),
    enabled: !!contractId && enabled,
  })
}

export function useRiskDetail(riskId: number | null) {
  return useQuery({
    queryKey: ['risk', riskId],
    queryFn: () => getRiskDetail(riskId!),
    enabled: !!riskId,
  })
}

export function useNegotiationGuide(riskId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['negotiation-guide', riskId],
    queryFn: () => getNegotiationGuide(riskId!),
    enabled: !!riskId && enabled,
  })
}
