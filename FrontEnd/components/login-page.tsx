"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { memberService } from "@/lib/member-service"
import { setAuthInfo } from "@/lib/auth-utils"

interface LoginPageProps {
  onPageChange: (page: string) => void
  onLoginSuccess: () => void
}

const LoginPage = ({ onPageChange, onLoginSuccess }: LoginPageProps) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    userid: "",
    userpw: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 에러 메시지 초기화
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 입력값 검증
    if (!formData.userid.trim()) {
      setError("아이디를 입력해주세요.")
      return
    }
    if (!formData.userpw.trim()) {
      setError("비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await memberService.login(formData)

      if (response.responseType === "SUCCESS" && response.data) {
        const token = typeof response.data === "string" ? response.data : response.data.token
        const storeId = response.data.storeId || response.data.store_id || null
        
        if (!token) {
          setError("토큰이 응답에 없습니다.")
        } else {
          // 백엔드에서 받은 role 사용 (없으면 기본값 "OWNER")
          const userRole = response.data.role || "OWNER"
          
          setAuthInfo({ 
            token, 
            userId: formData.userid, 
            role: userRole,
            storeId: storeId
          })
          
          // 역할에 따른 리다이렉트
          if (userRole === "USER") {
            router.replace("/")
          } else if (userRole === "ADMIN") {
            router.replace("/admin")
          } else {
            if (onLoginSuccess) onLoginSuccess()
          }
        }
      } else {
        setError(response.message || "로그인에 실패했습니다.")
      }
    } catch (error) {
      console.error("로그인 오류:", error)
      setError(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#0571e133] w-full min-h-screen flex items-center justify-center">
      <div className="w-full max-w-[1200px] h-[600px] flex rounded-[24px] overflow-hidden shadow-2xl">
        {/* 왼쪽 패널 - 브랜딩 영역 */}
        <div className="w-1/2 h-full bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute bottom-0 left-0 w-[300px] h-[300px]" viewBox="0 0 400 400">
              <circle cx="100" cy="300" r="200" fill="none" stroke="white" strokeWidth="2" />
              <circle cx="100" cy="300" r="250" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="100" cy="300" r="300" fill="none" stroke="white" strokeWidth="1" />
            </svg>
          </div>
          <div className="relative z-10 text-center px-12">
            <div className="flex justify-center mb-4">
              <Image 
                src="/logo_white.png" 
                alt="바로배달 로고" 
                width={200} 
                height={60}
                className="h-30 w-auto"
              />
            </div>
            <p className="text-white text-[18px] leading-relaxed mb-8">가장 빠르고 안전한 배달 서비스</p>
            <button
              onClick={() => onPageChange("home")}
              className="bg-[#0088ff] hover:bg-[#0077ee] text-white px-8 py-3 rounded-full text-[16px] font-semibold transition-all duration-200"
            >
              홈으로 가기
            </button>
          </div>
        </div>

        {/* 오른쪽 패널 - 로그인 폼 */}
        <div className="w-1/2 h-full bg-[#f5f5f5] flex items-center justify-center">
          <div className="w-[400px]">
            <div className="mb-12">
              <h2 className="text-[#1a1a1a] text-[32px] font-bold mb-2">안녕하세요!</h2>
              <p className="text-[#666666] text-[16px]">다시 만나서 반갑습니다</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#999999]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="아이디"
                  value={formData.userid}
                  onChange={handleChange}
                  name="userid"
                  disabled={isLoading}
                  className="w-full bg-white border border-[#e0e0e0] rounded-[12px] px-12 py-4 text-[16px] text-[#1a1a1a] placeholder-[#999999] focus:outline-none focus:border-[#0088ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  aria-label="아이디"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#999999]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.83333 9.16667V5.83333C5.83333 4.72826 6.27232 3.66846 7.05372 2.88706C7.83512 2.10565 8.89493 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10565 12.9463 2.88706C13.7277 3.66846 14.1667 4.72826 14.1667 5.83333V9.16667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={formData.userpw}
                  onChange={handleChange}
                  name="userpw"
                  disabled={isLoading}
                  className="w-full bg-white border border-[#e0e0e0] rounded-[12px] px-12 py-4 text-[16px] text-[#1a1a1a] placeholder-[#999999] focus:outline-none focus:border-[#0088ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  aria-label="비밀번호"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0088ff] hover:bg-[#0077ee] disabled:bg-[#0088ff]/60 text-white rounded-[12px] py-4 text-[16px] font-semibold transition-all duration-200 disabled:cursor-not-allowed relative"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  "로그인"
                )}
              </button>

              <div className="text-center">
                <p className="text-[#666666] text-[14px] mb-4">
                  계정이 없으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => onPageChange("member")}
                    className="text-[#0088ff] hover:text-[#0077ee] transition-colors font-medium"
                  >
                    회원가입
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
