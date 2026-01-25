import { useState, useCallback } from 'react'

interface FileUploadProps {
  onUpload: (file: File) => void
  isLoading: boolean
}

export default function FileUpload({ onUpload, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onUpload(file)
    },
    [onUpload]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onUpload(file)
    },
    [onUpload]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">계약서 분석 중...</p>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-600 mb-2">
            계약서 파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-400">PDF, TXT 지원</p>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
          >
            파일 선택
          </label>
        </>
      )}
    </div>
  )
}