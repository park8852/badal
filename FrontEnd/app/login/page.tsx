"use client"

import { useRouter } from "next/navigation"
import { getAuthInfo } from "@/lib/auth-utils"
import LoginPage from "@/components/login-page"

export default function LoginRoute() {
  const router = useRouter()

  const handlePageChange = (page: string) => {
    if (page === "member") {
      router.push("/register")
    } else if (page === "home") {
      router.push("/")
    }
  }

  const handleLoginSuccess = () => {
    const auth = getAuthInfo()
    
    // 역할에 따른 분기 처리
    if (auth?.role === "ADMIN") {
      // 어드민은 이미 login-page.tsx에서 처리되므로 여기서는 아무것도 하지 않음
      return
    } else if (auth?.role === "OWNER") {
      // 사장님만 가게 등록 여부 확인
      const hasStore = typeof auth?.storeId === "number"
      router.replace(hasStore ? "/dashboard" : "/store/create")
    } else {
      // 기타 역할은 홈으로
      router.replace("/")
    }
  }

  return <LoginPage onPageChange={handlePageChange} onLoginSuccess={handleLoginSuccess} />
}
