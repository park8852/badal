"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo } from "@/lib/auth-utils"
import { getNoticeList, NoticeItem } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar,
  User,
  Megaphone,
  Search,
  ArrowLeft
} from "lucide-react"

// NoticeItem 타입을 사용하므로 별도 인터페이스 불필요

const NoticePage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // 인증 확인
    if (!authInfo) {
      router.replace("/login")
      return
    }

    loadNotices()
  }, [authInfo, router])

  const loadNotices = async () => {
    try {
      const noticeList = await getNoticeList()
      setNotices(noticeList)
    } catch (error) {
      console.error("공지사항 로드 실패:", error)
    } finally {
      setIsLoading(false)
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

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const importantNotices = filteredNotices.filter(notice => notice.isImportant)
  const normalNotices = filteredNotices.filter(notice => !notice.isImportant)

  const getRoleText = () => {
    if (!authInfo) return "사용자"
    switch (authInfo.role) {
      case "ADMIN": return "관리자"
      case "OWNER": return "사장님"
      case "USER": return "사용자"
      default: return "사용자"
    }
  }

  const getDashboardPath = () => {
    if (!authInfo) return "/"
    switch (authInfo.role) {
      case "ADMIN": return "/admin"
      case "OWNER": return "/dashboard"
      case "USER": return "/"
      default: return "/"
    }
  }

  if (!authInfo) {
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
                onClick={() => router.push(getDashboardPath())}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>대시보드</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <Megaphone className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
                <p className="text-sm text-gray-500">바로배달 시스템 공지사항</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getRoleText()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 바 */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="공지사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {/* 중요 공지사항 */}
        {importantNotices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Badge variant="destructive" className="mr-2">중요</Badge>
              중요 공지사항
            </h2>
            <div className="space-y-4">
              {importantNotices.map((notice) => (
                <Card key={notice.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg text-red-900">{notice.title}</CardTitle>
                          <Badge variant="destructive" className="text-xs">
                            중요
                          </Badge>
                        </div>
                        <CardDescription className="text-red-800 whitespace-pre-wrap">
                          {notice.content}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-red-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{notice.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(notice.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 일반 공지사항 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">일반 공지사항</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : normalNotices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">공지사항이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {normalNotices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <CardDescription className="whitespace-pre-wrap">
                      {notice.content}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{notice.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(notice.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 전체 공지사항이 없을 때 */}
        {!isLoading && filteredNotices.length === 0 && searchTerm && (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">다른 검색어를 시도해보세요.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default NoticePage
