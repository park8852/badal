// API client for backend communication
import { handleAuthError } from "./auth-utils"
import { API_CONFIG, createApiUrl, API_LOGGING } from "./api-config"

// Get auth token from localStorage or cookie
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("authToken")
}

// Store API types
export interface StoreInfo {
    id: number
    memberId: number
    category: string
    name: string
    address: string
    phone: string
    openH: number
    openM: number
    closedH: number
    closedM: number
    thumbnail?: string  // 백엔드에서 thumbnail 사용
    createdAt: string
}

export interface UpdateStoreRequest {
    category: string
    name: string
    address: string
    phone: string
    openH: number
    openM: number
    closedH: number
    closedM: number
    thumbnail?: string  // 백엔드에서 thumbnail 사용
}

// Create Store API request type (different field names than StoreInfo)
export interface CreateStoreRequest {
    category: string
    name: string
    address: string
    phone: string
    openH: number
    openM: number
    closedH: number
    closedM: number
    createdAt: string
    thumbnail?: string  // 백엔드에서 thumbnail 사용
}

// Menu API types
export interface MenuItem {
    id: number
    storeId: number
    title: string
    content: string
    price: number
    thumbnail: string
}

export interface CreateMenuRequest {
    storeId: number
    title: string
    content: string
    price: number
    thumbnail?: string  // URL (파일 없을 때)
}

export interface UpdateMenuRequest {
    title: string
    content: string
    price: number
}

// Order API types
export interface Order {
    id: number
    memberId: number
    storeId: number
    menuId: number
    quantity: number
    totalPrice: number
    createdAt: string
    customerName: string
    customerPhone: string
    customerAddress: string
    storeName: string
    storeAddress: string
    menuTitle: string
    paymentMethod: string
}

export interface OrderDetail {
    id: number
    memberId: number
    storeId: number
    menuId: number
    quantity: number
    totalPrice: number
    createdAt: string
    customerName: string
    customerPhone: string
    customerAddress: string
    storeName: string
    storeAddress: string
    menuTitle: string
    paymentMethod: string
}

// Store API functions
export async function uploadFile(file: File): Promise<{ url: string }> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.UPLOAD)

    // FormData를 사용하여 파일 업로드
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type은 설정 안함! (브라우저가 자동으로 multipart/form-data 설정)
        },
        body: formData,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error("파일 업로드에 실패했습니다.")
    }

    const responseData = await response.json()

    const unwrapped = responseData && typeof responseData === "object" && "data" in responseData ? responseData.data : responseData
    return unwrapped as { url: string }
}

export async function createStore(data: CreateStoreRequest, file?: File): Promise<StoreInfo> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.STORE.CREATE)

    // 무조건 FormData로 전송
    const formData = new FormData()

    // 파일이 있으면 추가, 없으면 빈 문자열로 null 표현
    if (file) {
        formData.append("thumbnailFile", file)
    }

    // 다른 데이터들 추가
    formData.append("name", data.name)
    formData.append("category", data.category)
    formData.append("phone", data.phone)
    formData.append("address", data.address)
    formData.append("openH", data.openH.toString())
    formData.append("openM", data.openM.toString())
    formData.append("closedH", data.closedH.toString())
    formData.append("closedM", data.closedM.toString())
    formData.append("createdAt", data.createdAt)

    const body = formData
    const headers = {
        Authorization: `Bearer ${token}`,
        // Content-Type은 설정 안함! (브라우저가 자동으로 multipart/form-data 설정)
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        body,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error("Failed to create store")
    }

    const responseData = await response.json()
    const unwrapped = responseData && typeof responseData === "object" && "data" in responseData ? responseData.data : responseData
    return unwrapped as StoreInfo
}
// 모든 주문 조회 API (관리자용)
export async function getAllOrders(): Promise<Order[]> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.ORDER.LIST)

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            return []
        }
        const errorText = await response.text()
        throw new Error("Failed to fetch all orders")
    }

    const responseData = await response.json()

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as Order[]
    }

    return []
}

// 상점 삭제 API (관리자용)
export async function deleteStore(storeId: number): Promise<void> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.STORE.DELETE}/${storeId}`)

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        throw new Error("Failed to delete store")
    }
}

// 모든 가게 조회 API (관리자용)
export async function getAllStores(): Promise<StoreInfo[]> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.STORE.ALL)

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            return []
        }
        const errorText = await response.text()
        throw new Error("Failed to fetch all stores")
    }

    const responseData = await response.json()

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as StoreInfo[]
    }

    return []
}

export async function getStoreInfo(storeId: number): Promise<StoreInfo> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.STORE.INFO}/${storeId}`)

    console.log("[v0] GET Store Info Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Store Info Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Store Info Error:", errorText)
        throw new Error("Failed to fetch store info")
    }

    const responseData = await response.json()
    console.log("[v0] GET Store Info Data:", responseData)

    const storeInfo = responseData.data

    // 상대 경로를 전체 URL로 변환
    if (storeInfo.thumbnail && !storeInfo.thumbnail.startsWith('http')) {
        storeInfo.thumbnail = `${API_CONFIG.BASE_URL}/${storeInfo.thumbnail}`
    }

    return storeInfo
}

export async function updateStoreInfo(storeId: number, data: UpdateStoreRequest, file?: File): Promise<StoreInfo> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.STORE.INFO)

    console.log("[v0] Update Store Request:", { url, token: token ? "present" : "missing", data, hasFile: !!file })

    // 무조건 FormData로 전송
    const formData = new FormData()

    // 파일이 있으면 추가 (없으면 아예 보내지 않음)
    if (file) {
        formData.append("thumbnailFile", file)
    }

    // 다른 데이터들 추가
    formData.append("category", data.category)
    formData.append("name", data.name)
    formData.append("phone", data.phone)
    formData.append("address", data.address)
    formData.append("openH", data.openH.toString())
    formData.append("openM", data.openM.toString())
    formData.append("closedH", data.closedH.toString())
    formData.append("closedM", data.closedM.toString())

    const body = formData
    const headers = {
        Authorization: `Bearer ${token}`,
        // Content-Type은 설정 안함! (브라우저가 자동으로 multipart/form-data 설정)
    }

    console.log("📤 [FormData로 전송] 무조건 FormData 전송")

    const response = await fetch(url, {
        method: "POST",
        headers,
        body,
    })

    console.log("[v0] POST Update Store Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Update Store Error:", errorText)
        throw new Error("Failed to update store info")
    }

    const responseData = await response.json()
    console.log("[v0] POST Update Store Data:", responseData)
    return responseData
}

// Menu API functions
export async function getMenusByStore(storeId: number): Promise<MenuItem[]> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.MENU.STORE}/${storeId}`)

    console.log("[v0] GET Menus Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Menus Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Menus Error:", errorText)
        throw new Error("Failed to fetch menus")
    }

    const responseData = await response.json()
    console.log("[v0] GET Menus Data:", responseData)

    // 일부 API는 { data: [...] } 래핑 형태로 반환될 수 있으므로 안전하게 언래핑한다
    const unwrapped =
        responseData && typeof responseData === "object" && "data" in responseData
            ? (responseData as { data: unknown }).data
            : responseData

    if (!Array.isArray(unwrapped)) {
        console.error("[v0] GET Menus Unexpected Shape (expected array)", responseData)
        return []
    }

    // 상대 경로를 전체 URL로 변환
    const menus = (unwrapped as MenuItem[]).map(menu => ({
        ...menu,
        thumbnail: menu.thumbnail
            ? menu.thumbnail.startsWith('http')
                ? menu.thumbnail
                : `${API_CONFIG.BASE_URL}/${menu.thumbnail}`  // 상대 경로 → 전체 URL
            : menu.thumbnail
    }))

    return menus
}

export async function createMenu(data: CreateMenuRequest, file?: File): Promise<MenuItem> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.MENU.CREATE)

    console.log("[v0] POST Create Menu Request:", { url, token: token ? "present" : "missing", data, hasFile: !!file })

    // 무조건 FormData로 전송
    let body: FormData | string
    let headers: Record<string, string>

    const formData = new FormData()

    // 파일이 있으면 추가 (없으면 아예 보내지 않음 - null로 처리됨)
    if (file) {
        formData.append("thumbnailFile", file)
    }

    // 다른 데이터들 추가
    formData.append("storeId", data.storeId.toString())
    formData.append("title", data.title)
    formData.append("content", data.content)
    formData.append("price", data.price.toString())

    body = formData
    headers = {
        Authorization: `Bearer ${token}`,
        // Content-Type은 설정 안함! (브라우저가 자동으로 multipart/form-data 설정)
    }

    console.log("📤 [FormData로 전송] 무조건 FormData 전송")

    const response = await fetch(url, {
        method: "POST",
        headers,
        body,
    })

    console.log("[v0] POST Create Menu Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Create Menu Error:", errorText)
        throw new Error("Failed to create menu")
    }

    const responseData = await response.json()
    console.log("[v0] POST Create Menu Data:", responseData)
    // API 응답에서 data 필드만 추출하여 반환
    const unwrapped = responseData && typeof responseData === "object" && "data" in responseData ? responseData.data : responseData

    // 상대 경로를 전체 URL로 변환
    const menu = unwrapped as MenuItem
    if (menu.thumbnail && !menu.thumbnail.startsWith('http')) {
        menu.thumbnail = `${API_CONFIG.BASE_URL}/${menu.thumbnail}`
    }

    return menu
}

export async function updateMenu(menuId: number, data: UpdateMenuRequest, file?: File): Promise<void> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.MENU.INFO}/${menuId}`)

    console.log("[v0] PUT Update Menu Request:", { url, token: token ? "present" : "missing", menuId, data, hasFile: !!file })

    // 메뉴 수정은 항상 FormData로 전송 (백엔드 요구사항)
    const formData = new FormData()

    // 파일이 있으면 추가 (백엔드가 thumbnailFile 필드명을 사용)
    if (file) {
        formData.append("thumbnailFile", file)
    }

    // 데이터 추가
    formData.append("title", data.title)
    formData.append("content", data.content)
    formData.append("price", data.price.toString())

    const body = formData
    const headers = {
        Authorization: `Bearer ${token}`,
        // Content-Type은 설정 안함! (브라우저가 자동으로 multipart/form-data 설정)
    }

    console.log("📤 [FormData로 전송] 메뉴 수정")

    const response = await fetch(url, {
        method: "POST",
        headers,
        body,
    })

    console.log("[v0] PUT Update Menu Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] PUT Update Menu Error:", errorText)
        throw new Error("Failed to update menu")
    }

    const responseData = await response.json()
    console.log("[v0] PUT Update Menu Data:", responseData)
}

export async function deleteMenu(menuId: number): Promise<void> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.MENU.DELETE}/${menuId}`)

    console.log("[v0] DELETE Menu Request:", { url, token: token ? "present" : "missing", menuId })

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] DELETE Menu Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] DELETE Menu Error:", errorText)
        throw new Error("Failed to delete menu")
    }

    console.log("[v0] DELETE Menu Success")
}

// Order API functions
export async function getOrdersByStore(storeId: number): Promise<Order[]> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.ORDER.STORE}/${storeId}`)

    console.log("[v0] GET Orders Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Orders Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Orders Error:", errorText)
        throw new Error("Failed to fetch orders")
    }

    const responseData = await response.json()
    console.log("[v0] GET Orders Data:", responseData)

    const unwrapped =
        responseData && typeof responseData === "object" && "data" in responseData
            ? (responseData as { data: unknown }).data
            : responseData

    if (!Array.isArray(unwrapped)) {
        console.error("[v0] GET Orders Unexpected Shape (expected array)", responseData)
        return []
    }

    return unwrapped as Order[]
}

export async function getOrderDetail(orderId: number): Promise<OrderDetail> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.ORDER.DETAIL}/${orderId}`)

    console.log("[v0] GET Order Detail Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Order Detail Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Order Detail Error:", errorText)
        throw new Error("Failed to fetch order detail")
    }

    const responseData = await response.json()
    console.log("[v0] GET Order Detail Data:", responseData)

    // API 응답에서 data 필드만 추출하여 반환
    const unwrapped = responseData && typeof responseData === "object" && "data" in responseData ? responseData.data : responseData
    return unwrapped as OrderDetail
}

// 기간 내 주문 조회 API
export interface OrderPeriodRequest {
    startDay: string
    endDay: string
}

export interface OrderPeriodResponse {
    id: number
    memberId: number
    storeId: number
    menuId: number
    quantity: number
    totalPrice: number
    createdAt: string
    customerName: string
    customerPhone: string
    customerAddress: string
    storeName: string
    storeAddress: string
    menuTitle: string
    paymentMethod: string
}

export async function getOrdersByPeriod(data: OrderPeriodRequest): Promise<OrderPeriodResponse[]> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.ORDER.DAY)

    console.log("[v0] POST Order Period Request:", { url, token: token ? "present" : "missing", data })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    console.log("[v0] POST Order Period Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            return []
        }
        const errorText = await response.text()
        console.error("[v0] POST Order Period Error:", errorText)
        throw new Error("Failed to fetch orders by period")
    }

    const responseData = await response.json()
    console.log("[v0] POST Order Period Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as OrderPeriodResponse[]
    }

    return []
}

// 정산금액 조회 API (관리자용)
export interface SettlementRequest {
    storeId: number
    month: string // YYYY-MM 형식
}

export interface MenuSales {
    menuId: number
    menuName: string
    count: number
    amount: number
}

export interface SettlementResponse {
    storeId: number
    storeName: string
    menuSalesList: MenuSales[]
    totalAmount: number
}

export async function getSettlementData(data: SettlementRequest): Promise<SettlementResponse> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.ORDER.SALES)

    console.log("[v0] POST Settlement Request:", { url, token: token ? "present" : "missing", data })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    console.log("[v0] POST Settlement Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Settlement Error:", errorText)
        throw new Error("Failed to fetch settlement data")
    }

    const responseData = await response.json()
    console.log("[v0] POST Settlement Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as SettlementResponse
    }

    throw new Error("Invalid settlement response format")
}

// Q&A API types
export interface QAItem {
    id: number
    category: string
    memberId: number
    title: string
    content: string
    createdAt: string
    userid: string
}

// Q&A 조회 API (관리자용)
export async function getQAList(): Promise<QAItem[]> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.LIST}?category=qna`)

    console.log("[v0] GET Q&A List Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Q&A List Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            return []
        }
        const errorText = await response.text()
        console.error("[v0] GET Q&A List Error:", errorText)
        throw new Error("Failed to fetch Q&A list")
    }

    const responseData = await response.json()
    console.log("[v0] GET Q&A List Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as QAItem[]
    }

    return []
}

// Q&A 수정 API (관리자용)
export interface UpdateQARequest {
    id: number | null
    category: string
    memberId: number | null
    title: string
    content: string
    createdAt: string | null
}

export async function updateQA(qaId: number, data: UpdateQARequest): Promise<QAItem> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.UPDATE}/${qaId}`)

    console.log("[v0] POST Update Q&A Request:", { url, token: token ? "present" : "missing", qaId, data })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    console.log("[v0] POST Update Q&A Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Update Q&A Error:", errorText)
        throw new Error("Failed to update Q&A")
    }

    const responseData = await response.json()
    console.log("[v0] POST Update Q&A Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as QAItem
    }

    throw new Error("Invalid update Q&A response format")
}

// Q&A 삭제 API (관리자용)
export async function deleteQA(qaId: number): Promise<void> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.DELETE}/${qaId}`)

    console.log("[v0] GET Delete Q&A Request:", { url, token: token ? "present" : "missing", qaId })

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Delete Q&A Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Delete Q&A Error:", errorText)
        throw new Error("Failed to delete Q&A")
    }

    console.log("[v0] GET Delete Q&A Success")
}

// 공지사항 API types
export interface NoticeItem {
    id: number
    category: string
    memberId: number
    title: string
    content: string
    createdAt: string
    userid: string
}

// 공지사항 조회 API (관리자용)
export async function getNoticeList(): Promise<NoticeItem[]> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.LIST}?category=notice`)

    console.log("[v0] GET Notice List Request:", { url, token: token ? "present" : "missing" })

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Notice List Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            return []
        }
        const errorText = await response.text()
        console.error("[v0] GET Notice List Error:", errorText)
        throw new Error("Failed to fetch notice list")
    }

    const responseData = await response.json()
    console.log("[v0] GET Notice List Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as NoticeItem[]
    }

    return []
}

// 공지사항 생성 API (관리자용)
export interface CreateNoticeRequest {
    category: string
    title: string
    content: string
}

export async function createNotice(data: CreateNoticeRequest): Promise<NoticeItem> {
    const token = getAuthToken()
    const url = createApiUrl(API_CONFIG.ENDPOINTS.BOARD.LIST)

    console.log("[v0] POST Create Notice Request:", { url, token: token ? "present" : "missing", data })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    console.log("[v0] POST Create Notice Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Create Notice Error:", errorText)
        throw new Error("Failed to create notice")
    }

    const responseData = await response.json()
    console.log("[v0] POST Create Notice Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as NoticeItem
    }

    throw new Error("Invalid create notice response format")
}

// 공지사항 수정 API (관리자용)
export interface UpdateNoticeRequest {
    id: number | null
    category: string
    memberId: number | null
    title: string
    content: string
    createdAt: string | null
}

export async function updateNotice(noticeId: number, data: UpdateNoticeRequest): Promise<NoticeItem> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.UPDATE}/${noticeId}`)

    console.log("[v0] POST Update Notice Request:", { url, token: token ? "present" : "missing", noticeId, data })

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    console.log("[v0] POST Update Notice Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] POST Update Notice Error:", errorText)
        throw new Error("Failed to update notice")
    }

    const responseData = await response.json()
    console.log("[v0] POST Update Notice Data:", responseData)

    // API 응답 구조에 따라 데이터 추출
    if (responseData.responseType === "SUCCESS" && responseData.data) {
        return responseData.data as NoticeItem
    }

    throw new Error("Invalid update notice response format")
}

// 공지사항 삭제 API (관리자용)
export async function deleteNotice(noticeId: number): Promise<void> {
    const token = getAuthToken()
    const url = createApiUrl(`${API_CONFIG.ENDPOINTS.BOARD.DELETE}/${noticeId}`)

    console.log("[v0] GET Delete Notice Request:", { url, token: token ? "present" : "missing", noticeId })

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })

    console.log("[v0] GET Delete Notice Response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
        // 401 에러 시 자동 로그아웃 및 리다이렉션
        if (handleAuthError(response)) {
            throw new Error("Authentication failed")
        }
        const errorText = await response.text()
        console.error("[v0] GET Delete Notice Error:", errorText)
        throw new Error("Failed to delete notice")
    }

    console.log("[v0] GET Delete Notice Success")
}