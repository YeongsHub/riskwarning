import { useMutation } from '@tanstack/react-query'
import { register } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { RegisterCredentials } from '../types'

export function useRegister() {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: (data) => {
      setAuth(data.token, { email: data.email, name: data.name })
      navigate('/')
    },
  })
}
