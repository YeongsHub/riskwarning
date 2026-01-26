import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { LoginCredentials } from '../types'

export function useLogin() {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, { email: data.email, name: data.name })
      navigate('/')
    },
  })
}
