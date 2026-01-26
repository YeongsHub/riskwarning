export interface Contract {
  id: number
  filename: string
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