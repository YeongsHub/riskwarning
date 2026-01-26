import type { Contract, Risk, RiskDetail } from '../types'

const API_BASE = '/api'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return response
}

export async function uploadContract(file: File): Promise<Contract> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_BASE}/contracts`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload contract')
  }

  return response.json()
}

export async function getRisks(contractId: number): Promise<Risk[]> {
  const response = await fetchWithAuth(`${API_BASE}/contracts/${contractId}/risks`)

  if (!response.ok) {
    throw new Error('Failed to fetch risks')
  }

  return response.json()
}

export async function getRiskDetail(riskId: number): Promise<RiskDetail> {
  const response = await fetchWithAuth(`${API_BASE}/risks/${riskId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch risk detail')
  }

  return response.json()
}
