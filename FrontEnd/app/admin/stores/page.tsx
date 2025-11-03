"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { getAllStores, StoreInfo, deleteStore } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Store, 
  Search, 
  Eye, 
  Trash2,
  Clock,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  LogOut
} from "lucide-react"


const StoreManagementPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }

    loadStores()
  }, [authInfo, router])

  const loadStores = async () => {
    try {
      setIsLoading(true)
      const storesData = await getAllStores()
      
      // 실제 API 데이터만 사용 (가상 상태 정보 제거)
      setStores(storesData)
    } catch (error) {
      console.error("가게 목록 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 승인/거부 기능 제거 (실제 API에서 상태 관리 기능을 제공하지 않음)

  const handleDeleteStore = async (storeId: number) => {
    try {
      setErrorMessage("") // 에러 메시지 초기화
      await deleteStore(storeId)
      // 삭제 성공 시 목록에서 제거
      setStores(prev => prev.filter(store => store.id !== storeId))
      console.log(`가게 ${storeId} 삭제됨`)
    } catch (error) {
      console.error("가게 삭제 실패:", error)
      setErrorMessage("가게 삭제에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 상태 배지 함수 제거 (실제 API에서 상태 정보를 제공하지 않음)

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleLogout = () => {
    clearAuthInfo()
    router.replace("/login")
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
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>관리자 대시보드</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <Store className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">가게 관리</h1>
                <p className="text-sm text-gray-500">등록된 가게 목록 및 관리</p>
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
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 가게 수</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 가게</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stores.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="가게명, 주소, 카테고리로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {errorMessage}
            </div>
          </div>
        )}

        {/* 가게 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">가게가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredStores.map((store) => (
              <Card key={store.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <Badge variant="outline">{store.category}</Badge>
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{store.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{store.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(store.openH, store.openM)} - {formatTime(store.closedH, store.closedM)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>등록일: {formatDate(store.createdAt)}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStore(store)
                          setIsDetailDialogOpen(true)
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>상세</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>삭제</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>가게 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{store.name}" 가게를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStore(store.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* 가게 상세 다이얼로그 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>가게 상세 정보</DialogTitle>
              <DialogDescription>
                가게의 자세한 정보를 확인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            {selectedStore && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">가게명</label>
                    <p className="text-lg font-semibold">{selectedStore.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">카테고리</label>
                    <p className="text-lg">{selectedStore.category}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">주소</label>
                  <p className="text-lg">{selectedStore.address}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">전화번호</label>
                  <p className="text-lg">{selectedStore.phone}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">영업시간</label>
                    <p className="text-lg">
                      {formatTime(selectedStore.openH, selectedStore.openM)} - {formatTime(selectedStore.closedH, selectedStore.closedM)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">등록일</label>
                    <p className="text-lg">{formatDate(selectedStore.createdAt)}</p>
                  </div>
                </div>
                
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

export default StoreManagementPage
