// API 설정 중앙화
// 환경변수를 우선하고, 없으면 기본값 사용

export const API_CONFIG = {
  // 백엔드 서버 주소
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  
  // API 엔드포인트들
  ENDPOINTS: {
    // 인증 관련
    AUTH: {
      LOGIN: '/api/member/login',
      LOGOUT: '/api/member/logout',
      REGISTER: '/api/member/register',
      INFO: '/api/member/info',
    },
    
    // 가게 관련
    STORE: {
      CREATE: '/api/store/create',
      ALL: '/api/store/all',
      INFO: '/api/store/info',
      DELETE: '/api/store/delete',
    },
    
    // 메뉴 관련
    MENU: {
      CREATE: '/api/menu/create',
      STORE: '/api/menu/store',
      INFO: '/api/menu/info',
      DELETE: '/api/menu/delete',
    },
    
    // 주문 관련
    ORDER: {
      LIST: '/api/order/list',
      STORE: '/api/order/store',
      DETAIL: '/api/order',
      DAY: '/api/order/day',
      SALES: '/api/order/sales',
    },
    
    // 게시판 관련
    BOARD: {
      LIST: '/api/board',
      UPDATE: '/api/board/update',
      DELETE: '/api/board/delete',
    },
    
    // 파일 업로드
    UPLOAD: '/api/upload',
  },
  
  // 환경 정보
  ENV: {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
  }
}

// API URL 생성 헬퍼 함수
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// 환경별 로깅 설정
export const API_LOGGING = {
  ENABLED: API_CONFIG.ENV.IS_DEVELOPMENT,
  PREFIX: '[API]'
}
