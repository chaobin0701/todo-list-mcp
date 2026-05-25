import { http } from './http'

export type McpTokenRecord = {
  id: string
  name: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
}

export type McpTokenCreateResponse = {
  token: string
  record: McpTokenRecord
}

export function fetchMcpTokens() {
  return http.get<McpTokenRecord[]>('/mcp-tokens')
}

export function createMcpToken(payload: { name: string }) {
  return http.post<McpTokenCreateResponse>('/mcp-tokens', payload)
}

export function revokeMcpToken(id: string) {
  return http.delete(`/mcp-tokens/${id}`)
}
