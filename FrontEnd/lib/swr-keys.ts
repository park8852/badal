// SWR 캐시 키 관리
export const SWR_KEYS = {
  // Store 관련
  STORE_INFO: (storeId: number) => `store-info-${storeId}`,
  STORE_MENUS: (storeId: number) => `store-menus-${storeId}`,
  
  // Order 관련
  STORE_ORDERS: (storeId: number) => `store-orders-${storeId}`,
  ORDER_DETAIL: (orderId: number) => `order-detail-${orderId}`,
  ORDERS_BY_PERIOD: (startDay: string, endDay: string) => `orders-period-${startDay}-${endDay}`,
  
  // Member 관련
  MEMBER_INFO: (memberId: number) => `member-info-${memberId}`,
} as const

// 캐시 무효화 헬퍼
export const invalidateCache = {
  storeInfo: (storeId: number) => {
    // SWR mutate를 사용하여 캐시 무효화
    if (typeof window !== 'undefined') {
      const { mutate } = require('swr')
      mutate(SWR_KEYS.STORE_INFO(storeId))
    }
  },
  
  storeMenus: (storeId: number) => {
    if (typeof window !== 'undefined') {
      const { mutate } = require('swr')
      mutate(SWR_KEYS.STORE_MENUS(storeId))
    }
  },
  
  storeOrders: (storeId: number) => {
    if (typeof window !== 'undefined') {
      const { mutate } = require('swr')
      mutate(SWR_KEYS.STORE_ORDERS(storeId))
    }
  },
  
  allStoreData: (storeId: number) => {
    if (typeof window !== 'undefined') {
      const { mutate } = require('swr')
      mutate(SWR_KEYS.STORE_INFO(storeId))
      mutate(SWR_KEYS.STORE_MENUS(storeId))
      mutate(SWR_KEYS.STORE_ORDERS(storeId))
    }
  }
}
