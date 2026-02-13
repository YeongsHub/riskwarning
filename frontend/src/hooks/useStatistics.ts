import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../api/client'

export function useStatistics() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })
}
