export interface AuthInfo {
  token: string
  userId: string
  storeId?: number
  role: string
}

export function setAuthInfo(data: AuthInfo): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", data.token)
    localStorage.setItem("userId", data.userId)
    if (typeof data.storeId === "number") {
      localStorage.setItem("storeId", String(data.storeId))
    }else {
      localStorage.removeItem("storeId")
    }
    localStorage.setItem("role", data.role)
  }
}

export function getAuthInfo(): AuthInfo | null {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken")
    const userId = localStorage.getItem("userId")
    const storeId = localStorage.getItem("storeId")
    const role = localStorage.getItem("role")

    if (token && userId) {
      return {
        token,
        userId,
        storeId: storeId ? Number(storeId) : undefined,
        role: role || "USER",
      }
    }
  }
  return null
}

export function clearAuthInfo(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("storeId")
    localStorage.removeItem("role")
  }
}

export function isAuthenticated(): boolean {
  return getAuthInfo() !== null
}

// Vite React 프로젝트와의 호환성을 위한 추가 함수들
export function getAuthHeaders(): Record<string, string> {
  const authInfo = getAuthInfo()
  if (authInfo?.token) {
    return {
      Authorization: `Bearer ${authInfo.token}`,
      "Content-Type": "application/json",
    }
  }
  return {
    "Content-Type": "application/json",
  }
}

export function handleAuthError(response: Response): boolean {
  // 401 (Unauthorized) 또는 403 (Forbidden) 에러 처리
  if (response.status === 401 || response.status === 403) {
    clearAuthInfo()
    // 토큰 만료 시 알림 표시 후 로그인 페이지로 리다이렉션
    if (typeof window !== "undefined") {
      // 사용자에게 토큰 만료 알림 표시
      const showExpiredMessage = () => {
        // 커스텀 알림 메시지 생성
        const notification = document.createElement('div')
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 400px;
          animation: slideIn 0.3s ease-out;
        `
        notification.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 4px;">세션 만료</div>
          <div style="font-size: 14px; opacity: 0.9;">세션이 만료되었습니다. 다시 로그인해주세요.</div>
        `
        
        // CSS 애니메이션 추가
        const style = document.createElement('style')
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `
        document.head.appendChild(style)
        document.body.appendChild(notification)
        
        // 3초 후 알림 제거 및 리다이렉션
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease-out reverse'
          setTimeout(() => {
            document.body.removeChild(notification)
            document.head.removeChild(style)
            window.location.href = "/login"
          }, 300)
        }, 3000)
      }
      
      showExpiredMessage()
    }
    return true
  }
  return false
}

// 로그인 상태 확인 (Vite React와 동일한 인터페이스)
export function isLoggedIn(): boolean {
  return isAuthenticated()
}