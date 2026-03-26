import { env } from '#/env'

const API_BASE_URL = env.VITE_API_URL

interface FetchOptions extends RequestInit {
  credentials?: RequestCredentials
}

export async function apiFetch<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export function apiGet<T>(endpoint: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' })
}

export function apiPost<T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T>(endpoint: string, options?: Omit<FetchOptions, 'method'>): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'DELETE',
  })
}

export function apiWebSocketUrl(endpoint: string): string {
  const url = new URL(endpoint, API_BASE_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
