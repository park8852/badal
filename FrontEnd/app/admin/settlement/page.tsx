"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { getAllStores, StoreInfo, getSettlementData, SettlementRequest, SettlementResponse, MenuSales } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Search, 
  Store, 
  Calendar,
  Download,
  Eye
} from "lucide-react"

interface StoreSettlement {
  storeId: number
  storeName: string
  storeAddress: string
  selectedMonth: string
  settlementData?: SettlementResponse
  isLoading: boolean
  error?: string
}

const SettlementManagementPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [settlements, setSettlements] = useState<StoreSettlement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedSettlement, setSelectedSettlement] = useState<StoreSettlement | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }
    loadSettlementData()
  }, [authInfo, router])

  const loadSettlementData = async () => {
    try {
      setIsLoading(true)
      
      // 가게 데이터 가져오기
      const storesData = await getAllStores()
      setStores(storesData)
      
      // 가게별 정산 데이터 초기화
      const settlementData = storesData.map(store => ({
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        selectedMonth,
        isLoading: false,
        error: undefined
      }))
      
      setSettlements(settlementData)
      
    } catch (error) {
      console.error("정산 데이터 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 특정 가게의 정산 데이터 로드
  const loadStoreSettlement = async (storeId: number, month: string): Promise<StoreSettlement | null> => {
    try {
      // 해당 가게의 로딩 상태 업데이트
      setSettlements(prev => prev.map(s => 
        s.storeId === storeId 
          ? { ...s, isLoading: true, error: undefined }
          : s
      ))

      const settlementData = await getSettlementData({ storeId, month })
      
      // 정산 데이터 업데이트
      const updatedSettlement = {
        storeId,
        storeName: settlements.find(s => s.storeId === storeId)?.storeName || '',
        storeAddress: settlements.find(s => s.storeId === storeId)?.storeAddress || '',
        selectedMonth: month,
        settlementData,
        isLoading: false,
        error: undefined
      }
      
      setSettlements(prev => prev.map(s => 
        s.storeId === storeId 
          ? updatedSettlement
          : s
      ))
      
      return updatedSettlement
      
    } catch (error) {
      console.error(`가게 ${storeId} 정산 데이터 로드 실패:`, error)
      
      // 에러 상태 업데이트
      const errorSettlement = {
        storeId,
        storeName: settlements.find(s => s.storeId === storeId)?.storeName || '',
        storeAddress: settlements.find(s => s.storeId === storeId)?.storeAddress || '',
        selectedMonth: month,
        isLoading: false,
        error: error instanceof Error ? error.message : "정산 데이터 로드 실패"
      }
      
      setSettlements(prev => prev.map(s => 
        s.storeId === storeId 
          ? errorSettlement
          : s
      ))
      
      return errorSettlement
    }
  }

  // 월 변경 시 정산 데이터 초기화 (API 호출하지 않음)
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    // 월이 변경되면 기존 정산 데이터를 초기화
    setSettlements(prev => prev.map(settlement => ({
      ...settlement,
      selectedMonth: newMonth,
      settlementData: undefined, // 정산 데이터 초기화
      isLoading: false,
      error: undefined
    })))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleLogout = () => {
    clearAuthInfo()
    router.replace("/login")
  }

  const filteredSettlements = settlements.filter(settlement => {
    const matchesSearch = 
      settlement.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.storeAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })


  if (!authInfo || authInfo.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>뒤로</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">가게별 매출 정산</h1>
                <p className="text-sm text-gray-600">각 가게의 매출 현황과 정산 내역을 관리합니다</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {/* 정산 내역 내보내기 기능 구현 필요 */}}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>내보내기</span>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">조회 월</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {selectedMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                정산 기준 월
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">가게 수</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : settlements.length}
              </div>
              <p className="text-xs text-muted-foreground">
                등록된 가게
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="가게명, 주소로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {/* 정산 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">정산 데이터를 불러오는 중...</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">정산할 가게가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredSettlements.map((settlement) => (
              <Card key={settlement.storeId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{settlement.storeName}</CardTitle>
                        {settlement.settlementData && (
                          <Badge variant="outline">
                            {settlement.settlementData.menuSalesList.reduce((sum, menu) => sum + menu.count, 0)}주문
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="space-y-1">
                        <p>📍 {settlement.storeAddress}</p>
                        <p>📅 조회 월: {settlement.selectedMonth}</p>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          // 정산 데이터가 없으면 먼저 로드
                          if (!settlement.settlementData && !settlement.isLoading) {
                            const updatedSettlement = await loadStoreSettlement(settlement.storeId, settlement.selectedMonth)
                            setSelectedSettlement(updatedSettlement)
                          } else {
                            setSelectedSettlement(settlement)
                          }
                          
                          setIsDetailDialogOpen(true)
                        }}
                        className="flex items-center space-x-1"
                        disabled={settlement.isLoading}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{settlement.isLoading ? "로딩..." : "상세"}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {settlement.error ? (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-red-600 text-sm">{settlement.error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadStoreSettlement(settlement.storeId, settlement.selectedMonth)}
                        className="mt-2"
                      >
                        다시 시도
                      </Button>
                    </div>
                  ) : settlement.isLoading ? (
                    <div className="text-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">정산 데이터 로딩 중...</p>
                    </div>
                  ) : settlement.settlementData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">총 매출</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(settlement.settlementData.totalAmount)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">메뉴 종류</p>
                        <p className="text-lg font-bold text-blue-600">
                          {settlement.settlementData.menuSalesList.length}개
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">정산 데이터를 불러오려면 상세 버튼을 클릭하세요</p>
                      <p className="text-gray-400 text-xs mt-1">월 변경 시 자동으로 새로고침됩니다</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 정산 상세 다이얼로그 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>정산 상세 정보</DialogTitle>
              <DialogDescription>
                {selectedSettlement?.storeName}의 상세 정산 내역입니다.
              </DialogDescription>
            </DialogHeader>
            {selectedSettlement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">가게명</label>
                    <p className="text-lg font-semibold">{selectedSettlement.storeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">주소</label>
                    <p className="text-sm">{selectedSettlement.storeAddress}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">조회 월</label>
                    <p className="text-lg font-semibold">{selectedSettlement.selectedMonth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">총 매출</label>
                    <p className="text-lg font-semibold text-green-600">
                      {selectedSettlement.settlementData ? 
                        formatCurrency(selectedSettlement.settlementData.totalAmount) : 
                        "데이터 없음"
                      }
                    </p>
                  </div>
                </div>
                
                {selectedSettlement.settlementData && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-3 block">메뉴별 판매 내역</label>
                    <div className="space-y-2">
                      {selectedSettlement.settlementData.menuSalesList.map((menu) => (
                        <div key={menu.menuId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{menu.menuName}</p>
                            <p className="text-sm text-gray-600">{menu.count}개 판매</p>
                          </div>
                          <p className="font-bold text-green-600">
                            {formatCurrency(menu.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!selectedSettlement.settlementData && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">정산 데이터를 불러오는 중...</p>
                    <Button
                      variant="outline"
                      onClick={() => loadStoreSettlement(selectedSettlement.storeId, selectedSettlement.selectedMonth)}
                      className="mt-2"
                    >
                      데이터 불러오기
                    </Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default SettlementManagementPage
