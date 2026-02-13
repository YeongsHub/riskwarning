import type { AuthResponse, LoginCredentials, RegisterCredentials } from '../types'

const API_BASE = '/api'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  return response.json()
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || '회원가입에 실패했습니다.')
  }

  return response.json()
}
