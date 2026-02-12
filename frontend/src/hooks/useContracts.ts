import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContracts, getContract, deleteContract } from '../api/client'

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: getContracts,
  })
}

export function useContract(id: number) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => getContract(id),
    enabled: !!id,
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}
