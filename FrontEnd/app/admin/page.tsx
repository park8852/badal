"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { getAllStores, getAllOrders } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Store, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  LogOut,
  Shield,
  BarChart3,
  Package,
  UserCheck,
  Megaphone,
  HelpCircle
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  totalStores: number
  totalOrders: number
  totalRevenue: number
}

const AdminPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStores: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }

    // 관리자 통계 데이터 로드 (실제 API 연동 시 구현)
    loadAdminStats()
  }, [authInfo, router])

  const loadAdminStats = async () => {
    try {
      setIsLoading(true)
      
      // 실제 API에서 데이터 가져오기
      const [storesData, ordersData] = await Promise.all([
        getAllStores(),
        getAllOrders()
      ])
      
      // 총 매출 계산
      const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalPrice, 0)
      
      setStats({
        totalUsers: new Set(ordersData.map(order => order.memberId)).size, // 고유 고객 수
        totalStores: storesData.length, // 실제 가게 수
        totalOrders: ordersData.length, // 실제 주문 수
        totalRevenue: totalRevenue // 실제 총 매출
      })
    } catch (error) {
      console.error("관리자 통계 로드 실패:", error)
      // 에러 시 기본값 유지
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthInfo()
    router.replace("/login")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  if (!authInfo || authInfo.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-500">바로배달 시스템 관리</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                관리자
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            안녕하세요, {authInfo.userId}님!
          </h2>
          <p className="text-gray-600">
            바로배달 시스템의 전체 현황을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                고유 고객 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 가게</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalStores}
              </div>
              <p className="text-xs text-muted-foreground">
                실제 등록된 가게 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 주문</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalOrders.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                실제 주문 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                실제 총 매출
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 관리 기능 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-green-600" />
                <span>가게 관리</span>
              </CardTitle>
              <CardDescription>
                가게 등록 승인, 정보 수정, 영업 상태 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/admin/stores")}
              >
                가게 관리하기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span>주문 관리</span>
              </CardTitle>
              <CardDescription>
                전체 주문 현황, 배달 상태 추적, 문제 해결
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/admin/orders")}
              >
                주문 관리하기
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span>가게별 매출 정산</span>
              </CardTitle>
              <CardDescription>
                각 가게별 매출 현황, 정산 내역, 수수료 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/admin/settlement")}
              >
                정산 관리하기
              </Button>
            </CardContent>
          </Card>

          

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-indigo-600" />
                <span>공지사항 관리</span>
              </CardTitle>
              <CardDescription>
                시스템 공지사항 작성, 수정, 삭제 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/admin/notices")}
              >
                공지사항 관리
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-pink-600" />
                <span>Q&A 관리</span>
              </CardTitle>
              <CardDescription>
                사용자 문의사항 답변, FAQ 관리, 고객 지원
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push("/admin/qa")}
              >
                Q&A 관리하기
              </Button>
            </CardContent>
          </Card>

         
        </div>

        
      </main>
    </div>
  )
}

export default AdminPage
