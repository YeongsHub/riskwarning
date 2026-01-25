import type { Contract, Risk, RiskDetail } from '../types'

const API_BASE = '/api'

export async function uploadContract(file: File): Promise<Contract> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/contracts`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload contract')
  }

  return response.json()
}

export async function getRisks(contractId: number): Promise<Risk[]> {
  const response = await fetch(`${API_BASE}/contracts/${contractId}/risks`)

  if (!response.ok) {
    throw new Error('Failed to fetch risks')
  }

  return response.json()
}

export async function getRiskDetail(riskId: number): Promise<RiskDetail> {
  const response = await fetch(`${API_BASE}/risks/${riskId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch risk detail')
  }

  return response.json()
}