import { handleAuthError } from './auth-utils'
import { API_CONFIG, createApiUrl } from './api-config'

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

// 공통 API 호출 함수
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const url = createApiUrl(endpoint)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    // 401/403 에러 시 자동 로그아웃 및 리다이렉션
    if (handleAuthError(response)) {
      throw new Error("Authentication failed")
    }
    
    const errorText = await response.text()
    console.error(`API Error [${response.status}]:`, errorText)
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

// GET 요청 헬퍼
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' })
}

// POST 요청 헬퍼
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 요청 헬퍼
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 요청 헬퍼
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' })
}
