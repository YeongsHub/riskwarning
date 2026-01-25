import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import { useContractUpload } from '../hooks/useContractUpload'

export default function UploadPage() {
  const navigate = useNavigate()
  const uploadMutation = useContractUpload()

  const handleUpload = (file: File) => {
    uploadMutation.mutate(file, {
      onSuccess: (contract) => {
        navigate(`/result/${contract.id}`)
      },
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          계약서 리스크 분석
        </h2>
        <p className="text-gray-600">
          계약서를 업로드하면 AI가 법적 리스크를 자동으로 탐지합니다.
        </p>
      </div>

      <FileUpload onUpload={handleUpload} isLoading={uploadMutation.isPending} />

      {uploadMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          업로드 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}
    </div>
  )
}