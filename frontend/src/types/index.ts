export interface Contract {
  id: number
  filename: string
  status: string
  message: string
}

export interface User {
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  email: string
  name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface Risk {
  id: number
  clause: string
  level: RiskLevel
}

export interface RiskDetail extends Risk {
  reason: string
  suggestion: string | null
}

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export const RISK_COLORS: Record<RiskLevel, string> = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
}

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  HIGH: 'bg-red-50 border-red-500',
  MEDIUM: 'bg-amber-50 border-amber-500',
  LOW: 'bg-emerald-50 border-emerald-500',
}

export interface RiskSummary {
  high: number
  medium: number
  low: number
}

export interface ContractSummary {
  id: number
  filename: string
  status: string
  createdAt: string
  riskSummary: RiskSummary
}

export interface ContractDetail {
  id: number
  filename: string
  content: string
  status: string
  createdAt: string
}

export interface AnalysisProgress {
  step: 'EXTRACTING' | 'CHUNKING' | 'ANALYZING' | 'EVALUATING' | 'COMPLETED' | 'FAILED'
  message: string
  current: number
  total: number
}

export interface RecentContract {
  id: number
  filename: string
  status: string
  createdAt: string
}

export interface DashboardStats {
  totalContracts: number
  totalRisks: number
  risksByLevel: RiskSummary
  recentContracts: RecentContract[]
}

export interface NegotiationPerspective {
  summary: string
  negotiationPoints: string[]
}

export interface NegotiationGuide {
  gapPerspective: NegotiationPerspective
  eulPerspective: NegotiationPerspective
  alternativeClauses: string[]
  riskIfUnchanged: string
}

export interface RegulationAlert {
  id: number
  contractId: number
  contractFilename: string
  regulationName: string
  message: string
  read: boolean
  createdAt: string
}

export interface UnreadCount {
  count: number
}
