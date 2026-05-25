import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { fetchCurrentUser, login, register, type AuthResponse, type AuthUser } from '../api/auth'
import { authStorageKey } from '../api/http'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const isAuthenticated = computed(() => Boolean(token.value))

  function setToken(nextToken: string | null) {
    token.value = nextToken

    if (nextToken) {
      localStorage.setItem(authStorageKey, nextToken)
    } else {
      localStorage.removeItem(authStorageKey)
    }
  }

  function setSession(payload: AuthResponse) {
    setToken(payload.token)
    user.value = payload.user
  }

  async function bootstrap() {
    const savedToken = localStorage.getItem(authStorageKey)

    if (!savedToken) {
      initialized.value = true
      return
    }

    token.value = savedToken

    try {
      const response = await fetchCurrentUser()
      user.value = response.data
    } catch {
      clearSession()
    } finally {
      initialized.value = true
    }
  }

  async function loginWithPassword(email: string, password: string) {
    loading.value = true

    try {
      const response = await login({ email, password })
      setSession(response.data)
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function registerWithPassword(name: string, email: string, password: string) {
    loading.value = true

    try {
      const response = await register({
        email,
        password,
        ...(name.trim() ? { name: name.trim() } : {}),
      })
      setSession(response.data)
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function refreshCurrentUser() {
    if (!token.value) {
      user.value = null
      return null
    }

    const response = await fetchCurrentUser()
    user.value = response.data
    return response.data
  }

  function clearSession() {
    user.value = null
    setToken(null)
  }

  return {
    user,
    token,
    initialized,
    loading,
    isAuthenticated,
    setToken,
    setSession,
    bootstrap,
    loginWithPassword,
    registerWithPassword,
    refreshCurrentUser,
    clearSession,
  }
})
