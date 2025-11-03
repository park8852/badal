"use client"

import React, { useMemo, useState, useEffect } from "react"
import { CalendarDays, X, Check, CalendarRange, TrendingUp, DollarSign, ShoppingBag, Loader2, Eye } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { format, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth } from "date-fns"
import { ko } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getOrdersByPeriod, type OrderPeriodResponse } from "@/lib/api-client"

// Date helpers
type Range = { from?: Date; to?: Date } | undefined

function fmt(d?: Date) {
  return d ? format(d, "yyyy-MM-dd", { locale: ko }) : "-"
}

export default function RevenuePage() {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<Range>({ from: new Date(), to: new Date() })
  const [orders, setOrders] = useState<OrderPeriodResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const label = useMemo(() => {
    if (range?.from && range?.to) return `${fmt(range.from)} ~ ${fmt(range.to)}`
    if (range?.from) return `${fmt(range.from)} ~ 선택중`
    return "기간을 선택하세요"
  }, [range])

  // Quick presets
  const today = new Date()
  const presets = [
    {
      name: "오늘",
      run: () => setRange({ from: today, to: today }),
    },
    {
      name: "내일",
      run: () => {
        const tmr = new Date()
        tmr.setDate(tmr.getDate() + 1)
        setRange({ from: tmr, to: tmr })
      },
    },
    {
      name: "이번 주",
      run: () => {
        const from = startOfWeek(today, { weekStartsOn: 1 })
        const to = endOfWeek(today, { weekStartsOn: 1 })
        setRange({ from, to })
      },
    },
    {
      name: "다음 주",
      run: () => {
        const next = addWeeks(today, 1)
        const from = startOfWeek(next, { weekStartsOn: 1 })
        const to = endOfWeek(next, { weekStartsOn: 1 })
        setRange({ from, to })
      },
    },
    {
      name: "이번 달",
      run: () => {
        const from = startOfMonth(today)
        const to = endOfMonth(today)
        setRange({ from, to })
      },
    },
  ]

  // API 호출 함수
  const fetchOrders = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true)
      setError(null)
      
      const startDay = format(startDate, "yyyy-MM-dd")
      const endDay = format(endDate, "yyyy-MM-dd")
      
      const data = await getOrdersByPeriod({ startDay, endDay })
      setOrders(data)
    } catch (err) {
      console.error("Failed to fetch orders:", err)
      setError("주문 데이터를 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 기간이 변경될 때마다 API 호출
  useEffect(() => {
    if (range?.from && range?.to) {
      fetchOrders(range.from, range.to)
    }
  }, [range])

  // 매출 데이터 계산
  const revenueData = useMemo(() => {
    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        dailyRevenue: [],
        ordersByDate: new Map<string, OrderPeriodResponse[]>()
      }
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    // 일별 매출 데이터 생성 및 주문 목록 저장
    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    const ordersByDate = new Map<string, OrderPeriodResponse[]>()
    
    orders.forEach(order => {
      const date = order.createdAt.split(' ')[0] // "2025-10-24 17:15" -> "2025-10-24"
      const existing = dailyMap.get(date) || { revenue: 0, orders: 0 }
      dailyMap.set(date, {
        revenue: existing.revenue + order.totalPrice,
        orders: existing.orders + 1
      })
      
      // 해당 날짜의 주문 목록에 추가
      const dateOrders = ordersByDate.get(date) || []
      ordersByDate.set(date, [...dateOrders, order])
    })

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      dailyRevenue,
      ordersByDate
    }
  }, [orders])

  // 선택한 날짜의 주문 목록
  const selectedDateOrders = useMemo(() => {
    if (!selectedDate) return []
    return revenueData.ordersByDate?.get(selectedDate) || []
  }, [selectedDate, revenueData.ordersByDate])

  // 상세보기 모달 열기
  const handleShowDetail = (date: string) => {
    setSelectedDate(date)
    setShowDetailModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Sidebar />
      <main className="lg:ml-64 p-6 transition-all duration-300" id="main-content">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">매출 관리</h1>
              <p className="text-gray-600 mt-2">기간별 매출 현황을 확인하고 분석하세요</p>
            </div>

            {/* Period Selection Card */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">기간 설정</h2>
                    <p className="text-slate-500 mt-1">매출을 확인할 기간을 선택하세요</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button
                      onClick={() => setOpen(true)}
                      variant="outline"
                      size="default"
                      className="inline-flex items-center gap-2"
                    >
                      <CalendarDays className="w-5 h-5" />
                      기간 설정
                    </Button>
                    {range?.from && (
                      <Button
                        onClick={() => setRange(undefined)}
                        variant="destructive"
                        size="default"
                        className="inline-flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> 초기화
                      </Button>
                    )}
                  </div>
                </div>

                {/* 선택 요약 카드 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-slate-500">시작일</div>
                    <div className="text-lg font-semibold">{fmt(range?.from)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-slate-500">종료일</div>
                    <div className="text-lg font-semibold">{fmt(range?.to)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-slate-500">일수</div>
                    <div className="text-lg font-semibold">
                      {range?.from && range?.to
                        ? Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        : "-"}
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Revenue Summary */}
            {range?.from && range?.to && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {loading && (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">데이터를 불러오는 중...</span>
                  </div>
                )}
                
                {error && (
                  <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 매출</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {revenueData.totalRevenue.toLocaleString()}원
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 주문수</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {revenueData.totalOrders}건
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">평균 주문금액</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {revenueData.averageOrderValue.toLocaleString()}원
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">일평균 매출</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {revenueData.dailyRevenue.length > 0 
                          ? Math.round(revenueData.totalRevenue / revenueData.dailyRevenue.length).toLocaleString()
                          : 0}원
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Daily Revenue Chart */}
            {range?.from && range?.to && !loading && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">일별 매출 현황</h3>
                {revenueData.dailyRevenue.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    선택한 기간에 주문 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revenueData.dailyRevenue.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{day.date}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">주문수</div>
                            <div className="font-semibold">{day.orders}건</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">매출</div>
                            <div className="font-semibold text-green-600">
                              {day.revenue.toLocaleString()}원
                            </div>
                          </div>
                          <Button
                            onClick={() => handleShowDetail(day.date)}
                            variant="ghost"
                            size="sm"
                            className="ml-2 gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            상세보기
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
      </main>

     {/* 주문 상세 모달 */}
<AnimatePresence>
  {showDetailModal && (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setShowDetailModal(false)}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-[95%] md:w-[900px] h-[80vh] max-w-none flex flex-col overflow-hidden min-h-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Card className="p-0 h-full flex flex-col overflow-hidden min-h-0">
          {/* Header (고정 높이) */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-gray-600" />
              <div>
                <h3 className="text-lg font-semibold">주문 상세</h3>
                <p className="text-sm text-gray-500">{selectedDate}</p>
              </div>
            </div>
            <button
              className="p-2 rounded-xl hover:bg-slate-100"
              onClick={() => setShowDetailModal(false)}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (스크롤 영역) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {selectedDateOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                해당 날짜에 주문 데이터가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {/* 총계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">총 주문수</div>
                    <div className="text-2xl font-bold">{selectedDateOrders.length}건</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">총 매출</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedDateOrders
                        .reduce((sum, o) => sum + o.totalPrice, 0)
                        .toLocaleString()}원
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">평균 주문금액</div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        selectedDateOrders.reduce((s, o) => s + o.totalPrice, 0) /
                          selectedDateOrders.length
                      ).toLocaleString()}원
                    </div>
                  </Card>
                </div>

                {/* 주문 목록 */}
                <div className="space-y-3">
                  {selectedDateOrders.map((order, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-500">#{order.id}</span>
                            <span className="text-xs text-gray-400">{order.createdAt}</span>
                          </div>
                          <div className="font-semibold text-lg">{order.menuTitle}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">수량:</span>
                              <span className="ml-2 font-medium">{order.quantity}개</span>
                            </div>
                            <div>
                              <span className="text-gray-500">결제:</span>
                              <span className="ml-2 font-medium">{order.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">고객:</span>
                              <span className="ml-2 font-medium">{order.customerName}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">연락처:</span>
                              <span className="ml-2 font-medium">{order.customerPhone}</span>
                            </div>
                          </div>
                          {order.customerAddress && (
                            <div className="text-sm">
                              <span className="text-gray-500">주소:</span>
                              <span className="ml-2">{order.customerAddress}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600">
                            {order.totalPrice.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative z-10 w-[95%] max-w-3xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Card className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <CalendarRange className="w-5 h-5" /> 기간 선택
                  </div>
                  <button
                    className="p-2 rounded-xl hover:bg-slate-100"
                    onClick={() => setOpen(false)}
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Presets */}
                  <div className="md:col-span-1">
                    <div className="text-sm font-medium mb-2">빠른 선택</div>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          onClick={p.run}
                          className="text-left rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="md:col-span-3">
                    <DayPicker
                      locale={ko}
                      mode="range"
                      selected={range as any}
                      onSelect={setRange}
                      numberOfMonths={2}
                      pagedNavigation
                      weekStartsOn={1}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={2032}
                      className="mx-auto"
                      styles={{
                        caption: { fontWeight: 600 },
                        day: { borderRadius: 10 },
                      }}
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                      <div className="text-sm text-slate-600">
                        선택: <span className="font-medium">{label}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setRange(undefined)}
                          variant="outline"
                        >
                          초기화
                        </Button>
                        <Button
                          onClick={() => setOpen(false)}
                          disabled={!range?.from}
                          className="inline-flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> 적용
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
