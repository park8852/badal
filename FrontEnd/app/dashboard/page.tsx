"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Clock, Package } from "lucide-react"
import useSWR from "swr"
import { getOrdersByStore, getOrderDetail, Order } from "@/lib/api-client"
import { useState, useEffect } from "react"
import { getAuthInfo } from "@/lib/auth-utils"
import { SWR_KEYS } from "@/lib/swr-keys"

function getTimeAgo(dateString: string) {
  const now = new Date()
  const orderTime = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) return `${diffInMinutes}분 전`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}시간 전`
  return `${Math.floor(diffInHours / 24)}일 전`
}

export default function DashboardPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const storeId = getAuthInfo()?.storeId

  // 특정 상점의 주문 목록 가져오기 (SWR 자동 갱신 사용)
  const {
    data: allOrders,
    error: ordersError,
    isLoading: ordersLoading,
    mutate: mutateOrders,
  } = useSWR(
    storeId ? SWR_KEYS.STORE_ORDERS(storeId) : null, 
    () => getOrdersByStore(storeId as number),
    {
      refreshInterval: 10000, // 10초마다 자동 새로고침
      refreshWhenHidden: false, // 탭이 숨겨져 있을 때는 새로고침 안함
      refreshWhenOffline: false, // 오프라인일 때는 새로고침 안함
    }
  )

  // 선택된 주문 상세 정보 가져오기 (SWR 자동 갱신 사용)
  const {
    data: orderDetails,
    error: detailError,
    isLoading: detailLoading,
    mutate: mutateOrderDetail,
  } = useSWR(
    selectedOrderId ? SWR_KEYS.ORDER_DETAIL(selectedOrderId) : null, 
    () => selectedOrderId ? getOrderDetail(selectedOrderId) : null,
    {
      refreshInterval: 10000, // 10초마다 자동 새로고침
      refreshWhenHidden: false,
      refreshWhenOffline: false,
    }
  )

  // 첫 번째 주문 자동 선택
  useEffect(() => {
    if (allOrders && allOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(allOrders[0].id)
    }
  }, [allOrders, selectedOrderId])

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId(orderId)
  }

  // SWR이 자동으로 갱신을 처리하므로 수동 갱신 코드 제거

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8 transition-all duration-300" id="main-content">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">주문 관리</h1>
            <p className="mt-2 text-muted-foreground">실시간으로 들어오는 주문을 확인하고 관리하세요</p>
          </div>

          <DashboardStats />

          {/* 🔧 스크롤 이슈 해결: min-h-0 추가 */}
          <div className="grid grid-cols-10 gap-6 h[calc(100vh-200px)] h-[calc(100vh-200px)] min-h-0">
            {/* 좌측 주문 리스트 (30%) */}
             <div className="col-span-3 min-h-0">
               <Card className="h-full flex flex-col min-h-0 overflow-hidden">
                 <div className="p-4 pb-3 border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
                   <div>
                     <h2 className="text-lg font-semibold">최근 주문</h2>
                     <p className="text-sm text-muted-foreground mt-1">
                       총 {allOrders?.length || 0}건 • 자동 업데이트
                     </p>
                   </div>
                 </div>

                {ordersLoading && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-muted-foreground">주문 내역을 불러오는 중...</p>
                  </div>
                )}

                {ordersError && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-destructive">주문 내역을 불러오는데 실패했습니다.</p>
                  </div>
                )}

                {allOrders && allOrders.length === 0 && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-muted-foreground">주문 내역이 없습니다.</p>
                  </div>
                )}

                 <div className="flex-1 overflow-hidden">
                   {allOrders && allOrders.length > 0 && (
                     <div className="h-full overflow-y-auto p-2">
                       <div className="space-y-2">
                         {allOrders.map((order: Order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderSelect(order.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedOrderId === order.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-muted border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">#{order.id}</span>
                              <span className="text-xs opacity-80">{getTimeAgo(order.createdAt)}</span>
                            </div>
                            <p className="font-medium text-sm truncate">{order.menuTitle}</p>
                            <p className="text-xs opacity-80">수량: {order.quantity}개</p>
                            <p className="text-xs opacity-80">고객: {order.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {Number(order.totalPrice ?? 0).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </Card>
             </div>

            {/* 우측 주문 상세 정보 (70%) */}
            <div className="col-span-7 min-h-0">
              <Card className="h-full p-6 flex flex-col min-h-0 overflow-hidden">
                {detailLoading && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-muted-foreground">주문 상세를 불러오는 중...</p>
                  </div>
                )}

                {detailError && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-destructive">주문 상세를 불러오는데 실패했습니다.</p>
                  </div>
                )}

                {!selectedOrderId && (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-muted-foreground">주문을 선택해주세요.</p>
                  </div>
                )}

                {orderDetails && (
                  <div className="space-y-6 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold">주문 상세</h2>
                      <span className="text-lg text-muted-foreground">#{orderDetails.id}</span>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card className="p-4">
                        <h3 className="mb-3 text-lg font-semibold">주문 정보</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">주문 시간</p>
                              <p className="font-medium">
                                {new Date(orderDetails.createdAt).toLocaleString("ko-KR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">수량</p>
                              <p className="font-medium">{orderDetails.quantity}개</p>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="mb-3 text-lg font-semibold">고객 정보</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">고객명</p>
                            <p className="font-medium">{orderDetails.customerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">연락처</p>
                            <p className="font-medium">{orderDetails.customerPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">배송 주소</p>
                            <p className="font-medium">{orderDetails.customerAddress}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">결제 방법</p>
                            <p className="font-medium">{orderDetails.paymentMethod}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4">
                      <h3 className="mb-4 text-lg font-semibold">주문 상세</h3>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{orderDetails.menuTitle}</p>
                            <p className="text-sm text-muted-foreground mt-1">상점: {orderDetails.storeName}</p>
                            <p className="text-sm text-muted-foreground">주소: {orderDetails.storeAddress}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">수량</span>
                            <span>{orderDetails.quantity}개</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>총 금액</span>
                            <span>{Number(orderDetails.totalPrice ?? 0).toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
