"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { getAllOrders, Order } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Trash2,
  Clock,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  LogOut,
  User,
  Store,
  Package,
  CreditCard,
  Filter
} from "lucide-react"

const OrderManagementPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }

    loadOrders()
  }, [authInfo, router])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const ordersData = await getAllOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error("주문 목록 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    try {
      // 주문 삭제 API 호출 (백엔드에서 구현 필요)
      setOrders(prev => prev.filter(order => order.id !== orderId))
    } catch (error) {
      console.error("주문 삭제 실패:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case '선결제':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">선결제</Badge>
      case '후결제':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">후결제</Badge>
      case '현금':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">현금</Badge>
      default:
        return <Badge variant="secondary">{method}</Badge>
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.menuTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
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
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">주문 관리</h1>
                <p className="text-sm text-gray-500">전체 주문 목록 및 관리</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 주문 수</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매출</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(orders.reduce((sum, order) => sum + order.totalPrice, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">고객 수</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(orders.map(order => order.memberId)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">가게 수</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(orders.map(order => order.storeId)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="고객명, 가게명, 메뉴명, 주소로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">주문이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">주문 #{order.id}</CardTitle>
                        {getPaymentMethodBadge(order.paymentMethod)}
                        <Badge variant="outline">{order.storeName}</Badge>
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{order.customerPhone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{order.customerAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span>{order.menuTitle} x {order.quantity}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(order.totalPrice)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
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
                            <AlertDialogTitle>주문 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              주문 #{order.id}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order.id)}
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

        {/* 주문 상세 다이얼로그 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>주문 상세 정보</DialogTitle>
              <DialogDescription>
                주문의 자세한 정보를 확인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">주문 번호</label>
                    <p className="text-lg font-semibold">#{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">결제 방법</label>
                    <div className="mt-1">
                      {getPaymentMethodBadge(selectedOrder.paymentMethod)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">고객명</label>
                    <p className="text-lg">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">고객 전화번호</label>
                    <p className="text-lg">{selectedOrder.customerPhone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">고객 주소</label>
                  <p className="text-lg">{selectedOrder.customerAddress}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">가게명</label>
                    <p className="text-lg">{selectedOrder.storeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">가게 주소</label>
                    <p className="text-lg">{selectedOrder.storeAddress}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">메뉴</label>
                    <p className="text-lg">{selectedOrder.menuTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">수량</label>
                    <p className="text-lg">{selectedOrder.quantity}개</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">총 금액</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedOrder.totalPrice)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">주문 시간</label>
                    <p className="text-lg">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">고객 ID</label>
                    <p className="text-lg">{selectedOrder.memberId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">가게 ID</label>
                    <p className="text-lg">{selectedOrder.storeId}</p>
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

export default OrderManagementPage
