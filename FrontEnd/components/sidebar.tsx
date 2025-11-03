"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ShoppingCart, Store, UtensilsCrossed, LogOut, ChevronLeft, ChevronRight, User, TrendingUp, Shield, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuthInfo, getAuthInfo } from "@/lib/auth-utils"

const navigation = [
  { name: "주문 관리", href: "/dashboard", icon: ShoppingCart },
  { name: "가게 관리", href: "/store", icon: Store },
  { name: "메뉴 관리", href: "/menu", icon: UtensilsCrossed },
  { name: "매출 관리", href: "/revenue", icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  
  // 사이드바 상태를 전역으로 관리하기 위해 localStorage 사용
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    // 메인 콘텐츠의 마진을 동적으로 조정
    const mainElement = document.querySelector('#main-content')
    if (mainElement) {
      if (isCollapsed) {
        mainElement.classList.remove('lg:ml-64')
        mainElement.classList.add('lg:ml-16')
      } else {
        mainElement.classList.remove('lg:ml-16')
        mainElement.classList.add('lg:ml-64')
      }
    }
  }, [isCollapsed])
  
  // Get user info from localStorage on client side only
  useEffect(() => {
    setIsClient(true)
    setAuthInfo(getAuthInfo())
  }, [])

  const handleLogout = () => {
    clearAuthInfo()
    router.push("/login")
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <aside
      className={cn(
        "hidden border-r bg-sidebar transition-all duration-300 lg:block fixed left-0 top-0 h-screen z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* 헤더 */}
        <div className={cn(
          "border-b border-sidebar-border",
          isCollapsed ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <div className="flex-1">
                <Image 
                  src="/logo_white.png" 
                  alt="바로배달 로고" 
                  width={120} 
                  height={100}
                  className="h-14 w-auto"
                />
                <p className="mt-1 text-sm text-sidebar-foreground/70">
                  {isClient && authInfo?.role === "ADMIN" ? "관리자 대시보드" : "사장님 대시보드"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent/50 text-sidebar-foreground"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className={cn(
          "flex-1 space-y-1",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {/* 아이콘 컨테이너 고정 */}
                <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                {/* 텍스트는 접힘 시 숨김 */}
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
          
          {/* 공지사항 링크 (모든 사용자에게 표시) */}
          <Link
            href="/notices"
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname === "/notices"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            title={isCollapsed ? "공지사항" : undefined}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5" />
            </span>
            {!isCollapsed && <span className="ml-3">공지사항</span>}
          </Link>

          {/* 관리자 페이지 링크 (ADMIN 역할일 때만 표시) */}
          {isClient && authInfo?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                pathname === "/admin"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              title={isCollapsed ? "관리자 페이지" : undefined}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </span>
              {!isCollapsed && <span className="ml-3">관리자 페이지</span>}
            </Link>
          )}
        </nav>

        {/* 사용자 정보 및 마이페이지 */}
        <div className={cn(
          "border-t border-sidebar-border space-y-2",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {/* 사용자 정보 */}
          {isClient && authInfo?.userId && (
            <div className={cn(
              "flex items-center gap-3 py-2",
              isCollapsed ? "justify-center px-2" : "justify-start px-4"
            )}>
              {/* 아바타 */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                {authInfo.userId.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{authInfo.userId}</p>
                  <p className="text-xs text-sidebar-foreground/70">
                    {authInfo.role === "ADMIN" ? "관리자" : "사장님"}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* 마이페이지 버튼 */}
          <Button
            variant="ghost"
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors w-full",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            onClick={() => router.push("/myinfo")}
            title={isCollapsed ? "마이페이지" : undefined}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
              <User className="h-5 w-5" />
            </span>
            {!isCollapsed && <span className="ml-3">마이페이지</span>}
          </Button>
          
          {/* 로그아웃 버튼 */}
          <Button
            variant="ghost"
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors w-full",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "로그아웃" : undefined}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
              <LogOut className="h-5 w-5" />
            </span>
            {!isCollapsed && <span className="ml-3">로그아웃</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
