import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '../hooks/useAlerts'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 5

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts()
  const markAsRead = useMarkAlertAsRead()
  const markAllAsRead = useMarkAllAlertsAsRead()
  const [currentPage, setCurrentPage] = useState(1)

  const hasUnread = alerts?.some((a) => !a.read)
  const totalPages = Math.ceil((alerts?.length || 0) / PAGE_SIZE)
  const paginatedAlerts = alerts?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleAlertClick = (alertId: number) => {
    markAsRead.mutate(alertId)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">알림</h2>
        {hasUnread && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            모두 읽음
          </button>
        )}
      </div>

      {!alerts || alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">알림이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedAlerts!.map((alert) => (
              <Link
                key={alert.id}
                to={`/result/${alert.contractId}`}
                onClick={() => !alert.read && handleAlertClick(alert.id)}
                className={`block p-4 border rounded-xl transition-all ${
                  alert.read
                    ? 'bg-white border-gray-100 text-gray-500 shadow-sm'
                    : 'bg-blue-50 border-blue-200 text-gray-900 shadow-sm'
                } hover:shadow-md`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!alert.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {alert.regulationName}
                      </span>
                    </div>
                    <p className="text-sm break-words">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  )
}
