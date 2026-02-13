import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reanalyzeContract } from '../api/client'

export function useReanalyze() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reanalyzeContract,
    onSuccess: (_data, contractId) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
      queryClient.invalidateQueries({ queryKey: ['risks', contractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}
