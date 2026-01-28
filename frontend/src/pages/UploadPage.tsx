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
          Contract Risk Analysis
        </h2>
        <p className="text-gray-600">
          Upload a contract and AI will automatically detect legal risks.
        </p>
      </div>

      <FileUpload onUpload={handleUpload} isLoading={uploadMutation.isPending} />

      {uploadMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700">
          An error occurred during upload. Please try again.
        </div>
      )}
    </div>
  )
}