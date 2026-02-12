import type { AnalysisProgress as ProgressType } from '../types'

interface AnalysisProgressProps {
  progress: ProgressType | null
}

const STEPS = [
  { key: 'EXTRACTING', label: '텍스트 추출' },
  { key: 'CHUNKING', label: '텍스트 분석' },
  { key: 'ANALYZING', label: '규제 비교' },
  { key: 'EVALUATING', label: '위험도 평가' },
  { key: 'COMPLETED', label: '분석 완료' },
] as const

function getStepIndex(step: string): number {
  return STEPS.findIndex((s) => s.key === step)
}

export default function AnalysisProgress({ progress }: AnalysisProgressProps) {
  const currentIndex = progress ? getStepIndex(progress.step) : -1

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex || progress?.step === 'COMPLETED'
          const isCurrent = index === currentIndex && progress?.step !== 'COMPLETED'

          return (
            <div key={step.key} className="flex items-center gap-3">
              {/* Status icon */}
              <div className="shrink-0">
                {isComplete ? (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span
                  className={`text-sm ${
                    isComplete
                      ? 'text-green-700 font-medium'
                      : isCurrent
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && progress?.message && (
                  <p className="text-xs text-gray-500 mt-0.5">{progress.message}</p>
                )}
              </div>

              {/* Progress indicator for current step */}
              {isCurrent && progress && progress.total > 0 && (
                <span className="text-xs text-gray-500">
                  {progress.current}/{progress.total}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {progress?.step === 'FAILED' && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm">
          {progress.message}
        </div>
      )}
    </div>
  )
}
