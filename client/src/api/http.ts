import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const authStorageKey = 'todo-demo-auth-token'

export const http = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(authStorageKey)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export { authStorageKey, apiBaseUrl }
