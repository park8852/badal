"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo } from "@/lib/auth-utils"
import { Download, QrCode, CheckCircle, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getAuthInfo()
    setAuthInfo(auth)
    setIsLoading(false)
  }, [])

  const handleOwnerLogin = () => {
    router.push("/login")
  }

  const handleDownloadApp = () => {
    // 실제 앱스토어 링크로 변경
    window.open("http://43.201.85.43:8080/app/baro-baedal.apk", "_blank")
  }

  const handleDownloadIOS = () => {
    // 실제 앱스토어 링크로 변경
    window.open("http://43.201.85.43:8080/app/baro-baedal.apk", "_blank")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 모든 사용자에게 모바일 앱 페이지 표시

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/mobile_bg.jpg')" }}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* 헤더 */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/80 bg-white/90 border-b">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOwnerLogin}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <Store className="h-4 w-4" />
              사장님 계정으로 로그인하기
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              회원가입
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 mr-8">
        <div className="text-center mb-12 mr-8">
          <Image 
            src="/logo_black_in.png" 
            alt="바로배달 로고" 
            width={700} 
            height={100}
            className="mx-auto mb-6"
          />
          
          <p className="text-xl text-white max-w-2xl mx-auto drop-shadow-lg">
            언제 어디서나 간편하게 주문하세요!<br />
            모바일 앱에서 더 빠르고 편리한 배달 서비스를 경험해보세요.
          </p>
        </div>

        {/* 주요 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 mr-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">빠른 주문</h3>
            <p className="text-gray-600 text-sm">
              원클릭으로 간편하게 주문하고 실시간으로 배달 상태를 확인하세요.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">QR 코드 주문</h3>
            <p className="text-gray-600 text-sm">
              QR 코드를 스캔하여 메뉴를 확인하고 바로 주문할 수 있습니다.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">푸시 알림</h3>
            <p className="text-gray-600 text-sm">
              주문 상태 변경, 할인 정보 등을 실시간으로 알려드립니다.
            </p>
          </div>
        </div>

        {/* 다운로드 섹션 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 mb-8 mr-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              지금 다운로드하세요
            </h2>
            <p className="text-gray-600">
              iOS와 Android 모두 지원합니다
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleDownloadApp}
              className="flex items-center gap-3 bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-semibold"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">G</span>
              </div>
              <div className="text-left">
                <div className="text-xs opacity-80">GET IT ON</div>
                <div className="text-sm font-bold">Google Play</div>
              </div>
            </Button>

            <Button
              onClick={handleDownloadIOS}
              className="flex items-center gap-3 bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-semibold"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <div className="text-left">
                <div className="text-xs opacity-80">Download on the</div>
                <div className="text-sm font-bold">App Store</div>
              </div>
            </Button>
          </div>
        </div>

        
      </main>

      {/* 푸터 */}
      <footer className="relative z-10 bg-white/90 backdrop-blur-sm border-t border-white/20 mt-16">
        <div className="w-full px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* 회사 정보 */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Image 
                    src="/logo_black.png" 
                    alt="바로배달 로고" 
                    width={120} 
                    height={30}
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-600 text-sm mb-4 max-w-md">
                  가장 빠르고 안전한 배달 서비스로 고객과 사장님을 연결하는 플랫폼입니다.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* 서비스 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">서비스</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-gray-900 transition-colors">배달 주문</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">가게 등록</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">메뉴 관리</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">주문 관리</a></li>
                </ul>
              </div>

              {/* 고객지원 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">고객지원</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-gray-900 transition-colors">자주 묻는 질문</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">고객센터</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">이용약관</a></li>
                  <li><a href="#" className="hover:text-gray-900 transition-colors">개인정보처리방침</a></li>
                </ul>
              </div>
            </div>

            {/* 하단 정보 */}
            <div className="border-t border-gray-200 mt-8 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <div className="mb-4 md:mb-0">
                  <p>© 2024 바로배달. All rights reserved.</p>
                </div>
                <div className="flex gap-6">
                  <a href="#" className="hover:text-gray-700 transition-colors">이용약관</a>
                  <a href="#" className="hover:text-gray-700 transition-colors">개인정보처리방침</a>
                  <a href="#" className="hover:text-gray-700 transition-colors">사업자정보</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}



