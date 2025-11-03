import useSWR, { SWRConfiguration } from 'swr'

// 공통 SWR 설정
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // 2초 내 중복 요청 제거
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  refreshInterval: 0, // 기본적으로 자동 새로고침 비활성화
}

// 대시보드용 설정 (자동 새로고침 활성화)
export const dashboardSwrConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 10000, // 10초마다 새로고침 (30초에서 변경)
  refreshWhenHidden: false, // 탭이 숨겨져 있을 때는 새로고침 안함
  refreshWhenOffline: false, // 오프라인일 때는 새로고침 안함
}

// 실시간 데이터용 설정
export const realtimeSwrConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 15000, // 15초마다 새로고침
  refreshWhenHidden: false,
}

// 정적 데이터용 설정
export const staticSwrConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
}
