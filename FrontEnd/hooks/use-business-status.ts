import { useMemo } from 'react'
import useSWR from 'swr'
import { getStoreInfo, type StoreInfo } from '@/lib/api-client'
import { getAuthInfo } from '@/lib/auth-utils'

export interface BusinessStatus {
  isOpen: boolean
  statusText: string
  openTime: string
  closeTime: string
  hoursUntilOpen?: number
  minutesUntilOpen?: number
}

export function useBusinessStatus() {
  const authInfo = getAuthInfo()
  const storeId = authInfo?.storeId
  
  const { data: storeData } = useSWR(
    storeId ? `store-info-${storeId}` : null, 
    () => storeId ? getStoreInfo(storeId) : null
  )

  const businessStatus = useMemo((): BusinessStatus => {
    if (!storeData) {
      return {
        isOpen: false,
        statusText: "영업시간 정보 없음",
        openTime: "00:00",
        closeTime: "00:00"
      }
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute
    
    const openTime = storeData.openH * 60 + storeData.openM
    const closeTime = storeData.closedH * 60 + storeData.closedM
    
    const isOpen = currentTime >= openTime && currentTime <= closeTime
    
    const openTimeStr = `${storeData.openH.toString().padStart(2, '0')}:${storeData.openM.toString().padStart(2, '0')}`
    const closeTimeStr = `${storeData.closedH.toString().padStart(2, '0')}:${storeData.closedM.toString().padStart(2, '0')}`
    
    let statusText = ""
    let hoursUntilOpen: number | undefined
    let minutesUntilOpen: number | undefined
    
    if (isOpen) {
      statusText = "영업중"
    } else if (currentTime < openTime) {
      const timeUntilOpen = openTime - currentTime
      hoursUntilOpen = Math.floor(timeUntilOpen / 60)
      minutesUntilOpen = timeUntilOpen % 60
      
      if (hoursUntilOpen > 0) {
        statusText = `${hoursUntilOpen}시간 ${minutesUntilOpen}분 후 영업 시작`
      } else {
        statusText = `${minutesUntilOpen}분 후 영업 시작`
      }
    } else {
      statusText = "영업 종료"
    }

    return {
      isOpen,
      statusText,
      openTime: openTimeStr,
      closeTime: closeTimeStr,
      hoursUntilOpen,
      minutesUntilOpen
    }
  }, [storeData])

  return businessStatus
}
