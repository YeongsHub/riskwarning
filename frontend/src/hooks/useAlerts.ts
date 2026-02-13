import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, getUnreadAlertCount, markAlertAsRead, markAllAlertsAsRead } from '../api/client'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: getUnreadAlertCount,
    refetchInterval: 30000,
  })
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAlertAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllAlertsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
