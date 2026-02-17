import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FileUpload from '../components/FileUpload'
import { useContractUpload } from '../hooks/useContractUpload'
import type { Industry } from '../types'

const INDUSTRIES: Industry[] = ['GENERAL', 'REAL_ESTATE', 'EMPLOYMENT', 'TAX_ACCOUNTING']

export default function UploadPage() {
  const navigate = useNavigate()
  const uploadMutation = useContractUpload()
  const [industry, setIndustry] = useState<Industry>('GENERAL')
  const { t } = useTranslation()

  const handleUpload = (file: File) => {
    uploadMutation.mutate({ file, industry }, {
      onSuccess: (contract) => {
        navigate(`/result/${contract.id}`)
      },
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('upload.title')}
        </h2>
        <p className="text-gray-500">
          {t('upload.description')}
        </p>
      </div>

      {/* Industry Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('upload.industryLabel')}
        </label>
        <p className="text-xs text-gray-400 mb-3">
          {t('upload.industryHint')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INDUSTRIES.map((key) => (
            <button
              key={key}
              onClick={() => setIndustry(key)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                industry === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {t(`upload.industry.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <FileUpload onUpload={handleUpload} isLoading={uploadMutation.isPending} />

      {uploadMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {t('upload.uploadError')}
        </div>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('upload.featureAiTitle')}</h3>
          <p className="text-xs text-gray-500">{t('upload.featureAiDesc')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('upload.featureNegotiationTitle')}</h3>
          <p className="text-xs text-gray-500">{t('upload.featureNegotiationDesc')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('upload.featureAlertTitle')}</h3>
          <p className="text-xs text-gray-500">{t('upload.featureAlertDesc')}</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        {t('upload.disclaimer')}
      </p>
    </div>
  )
}
