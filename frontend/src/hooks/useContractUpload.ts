import { useMutation } from '@tanstack/react-query'
import { uploadContract } from '../api/client'

export function useContractUpload() {
  return useMutation({
    mutationFn: uploadContract,
  })
}
