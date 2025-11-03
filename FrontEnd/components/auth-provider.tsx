"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, getAuthInfo } from "@/lib/auth-utils"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicRoutes = ["/", "/login", "/register"]
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!isPublicRoute && !isAuthenticated()) {
      router.push("/login")
      return
    }

    if (isAuthenticated()) {
      const auth = getAuthInfo()
      const hasStore = typeof auth?.storeId === "number"


      // 스토어 없는 사용자는 대시보드/메뉴/주문/스토어관리 페이지 접근 시 생성 페이지로
      const protectedNeedsStore = ["/dashboard", "/menu", "/orders", "/store"]
      if (!hasStore && protectedNeedsStore.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        router.push("/store/create")
        return
      }

      // 스토어 있는 사용자가 생성 페이지로 가면 대시보드로
      if (hasStore && pathname === "/store/create") {
        router.push("/dashboard")
        return
      }
    }
  }, [pathname, router])

  return <>{children}</>
}
