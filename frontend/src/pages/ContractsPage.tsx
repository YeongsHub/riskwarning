import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useContracts, useDeleteContract, useDeleteAllContracts } from '../hooks/useContracts'
import { useReanalyze } from '../hooks/useReanalyze'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 5

export default function ContractsPage() {
  const navigate = useNavigate()
  const { data: contracts, isLoading, isError } = useContracts()
  const deleteMutation = useDeleteContract()
  const deleteAllMutation = useDeleteAllContracts()
  const reanalyzeMutation = useReanalyze()
  const [currentPage, setCurrentPage] = useState(1)
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'

  const totalPages = Math.ceil((contracts?.length || 0) / PAGE_SIZE)
  const paginatedContracts = contracts?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleReanalyze = (id: number) => {
    if (window.confirm(t('contracts.confirmReanalyze'))) {
      reanalyzeMutation.mutate(id, {
        onSuccess: () => navigate(`/result/${id}`),
      })
    }
  }

  const handleDelete = (id: number, filename: string) => {
    if (window.confirm(t('contracts.confirmDelete', { filename }))) {
      deleteMutation.mutate(id, {
        onSuccess: () => setCurrentPage(1),
      })
    }
  }

  const handleDeleteAll = () => {
    if (window.confirm(t('contracts.confirmDeleteAll'))) {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => setCurrentPage(1),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('contracts.loadError')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('contracts.title')}</h2>
          <p className="text-gray-600">
            {t('contracts.totalCount', { count: contracts?.length || 0 })}
          </p>
        </div>
        <div className="flex gap-2">
          {contracts && contracts.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllMutation.isPending}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              {deleteAllMutation.isPending ? t('contracts.deletingAll') : t('contracts.deleteAll')}
            </button>
          )}
          <Link
            to="/"
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            {t('contracts.newAnalysis')}
          </Link>
        </div>
      </div>

      {paginatedContracts && paginatedContracts.length > 0 ? (
        <>
          <div className="space-y-3">
            {paginatedContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <Link
                    to={`/result/${contract.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-medium text-gray-900 truncate">
                      {contract.filename}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(contract.createdAt).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {contract.status === 'ANALYZING' && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {t('contracts.analyzing')}
                      </span>
                    )}
                    {contract.status === 'FAILED' && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        {t('contracts.failed')}
                      </span>
                    )}
                    {contract.status === 'COMPLETED' && (
                      <div className="flex gap-2 mt-2">
                        {contract.riskSummary.high > 0 && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                            HIGH: {contract.riskSummary.high}
                          </span>
                        )}
                        {contract.riskSummary.medium > 0 && (
                          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">
                            MEDIUM: {contract.riskSummary.medium}
                          </span>
                        )}
                        {contract.riskSummary.low > 0 && (
                          <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
                            LOW: {contract.riskSummary.low}
                          </span>
                        )}
                        {contract.riskSummary.high === 0 &&
                          contract.riskSummary.medium === 0 &&
                          contract.riskSummary.low === 0 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {t('contracts.noRisk')}
                            </span>
                          )}
                      </div>
                    )}
                  </Link>
                  <div className="ml-4 flex gap-2 shrink-0">
                    {contract.status !== 'ANALYZING' && (
                      <button
                        onClick={() => handleReanalyze(contract.id)}
                        disabled={reanalyzeMutation.isPending}
                        className="text-sm text-gray-400 hover:text-amber-600"
                      >
                        {t('contracts.reanalyze')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(contract.id, contract.filename)}
                      disabled={deleteMutation.isPending}
                      className="text-sm text-gray-400 hover:text-red-500"
                    >
                      {t('contracts.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>{t('contracts.empty')}</p>
          <Link to="/" className="text-blue-500 hover:underline mt-2 inline-block">
            {t('contracts.emptyAction')}
          </Link>
        </div>
      )}
    </div>
  )
}
