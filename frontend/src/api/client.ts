import type { Contract, Risk, RiskDetail, ContractSummary, ContractDetail, DashboardStats, NegotiationGuide, RegulationAlert, UnreadCount } from '../types'

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

export async function getContracts(): Promise<ContractSummary[]> {
  const response = await fetchWithAuth(`${API_BASE}/contracts`)

  if (!response.ok) {
    throw new Error('Failed to fetch contracts')
  }

  return response.json()
}

export async function getContract(id: number): Promise<ContractDetail> {
  const response = await fetchWithAuth(`${API_BASE}/contracts/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch contract')
  }

  return response.json()
}

export async function deleteContract(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/contracts/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete contract')
  }
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

export async function downloadReport(contractId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/contracts/${contractId}/report`)

  if (!response.ok) {
    throw new Error('Failed to download report')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${contractId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetchWithAuth(`${API_BASE}/dashboard/stats`)

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }

  return response.json()
}

export async function reanalyzeContract(id: number): Promise<Contract> {
  const response = await fetchWithAuth(`${API_BASE}/contracts/${id}/reanalyze`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to reanalyze contract')
  }

  return response.json()
}

export async function getNegotiationGuide(riskId: number): Promise<NegotiationGuide> {
  const response = await fetchWithAuth(`${API_BASE}/risks/${riskId}/negotiation-guide`)

  if (!response.ok) {
    throw new Error('Failed to fetch negotiation guide')
  }

  return response.json()
}

export async function getAlerts(): Promise<RegulationAlert[]> {
  const response = await fetchWithAuth(`${API_BASE}/alerts`)

  if (!response.ok) {
    throw new Error('Failed to fetch alerts')
  }

  return response.json()
}

export async function getUnreadAlertCount(): Promise<UnreadCount> {
  const response = await fetchWithAuth(`${API_BASE}/alerts/unread-count`)

  if (!response.ok) {
    throw new Error('Failed to fetch unread count')
  }

  return response.json()
}

export async function markAlertAsRead(alertId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/alerts/${alertId}/read`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to mark alert as read')
  }
}

export async function markAllAlertsAsRead(): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/alerts/read-all`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to mark all alerts as read')
  }
}

export { getAuthHeaders }
