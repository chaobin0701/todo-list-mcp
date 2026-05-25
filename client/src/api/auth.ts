import { http } from './http'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

type RegisterInput = {
  email: string
  password: string
  name?: string
}

type LoginInput = {
  email: string
  password: string
}

export function register(payload: RegisterInput) {
  return http.post<AuthResponse>('/auth/register', payload)
}

export function login(payload: LoginInput) {
  return http.post<AuthResponse>('/auth/login', payload)
}

export function fetchCurrentUser() {
  return http.get<AuthUser>('/auth/me')
}
