"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { getQAList, QAItem, deleteQA } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  LogOut,
  Shield,
  HelpCircle,
  MessageSquare,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2
} from "lucide-react"

const QAAdminPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [qaList, setQaList] = useState<QAItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }

    // Q&A 데이터 로드
    loadQAList()
  }, [authInfo, router])

  const loadQAList = async () => {
    try {
      setIsLoading(true)
      // 실제 API에서 Q&A 데이터 가져오기
      const qaData = await getQAList()
      setQaList(qaData)
    } catch (error) {
      console.error("Q&A 목록 로드 실패:", error)
      setQaList([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthInfo()
    router.replace("/login")
  }

  const handleDeleteQA = async (qaId: number) => {
    const qa = qaList.find(item => item.id === qaId)
    if (!qa) return

    // 관리자는 모든 Q&A를 삭제할 수 있지만, 일반 사용자는 자신이 작성한 글만 삭제 가능
    if (authInfo?.role !== "ADMIN" && qa.memberId !== authInfo?.memberId) {
      alert("자신이 작성한 글만 삭제할 수 있습니다.")
      return
    }

    if (!confirm("정말로 이 Q&A를 삭제하시겠습니까?")) {
      return
    }

    try {
      await deleteQA(qaId)
      // 삭제 성공 시 목록 새로고침
      await loadQAList()
      alert("Q&A가 성공적으로 삭제되었습니다.")
    } catch (error) {
      console.error("Q&A 삭제 실패:", error)
      alert("Q&A 삭제에 실패했습니다.")
    }
  }

  const getStatusBadge = () => {
    // API에서는 답변 상태 정보가 없으므로 기본적으로 "답변 대기"로 표시
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">답변 대기</Badge>
  }

  const getStatusIcon = () => {
    // API에서는 답변 상태 정보가 없으므로 기본적으로 시계 아이콘으로 표시
    return <Clock className="h-4 w-4 text-yellow-600" />
  }

  const filteredQAList = qaList.filter(qa => {
    const matchesSearch = qa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qa.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || qa.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (!authInfo || authInfo.role !== "ADMIN") {
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
                size="sm"
                onClick={() => router.push("/admin")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>뒤로가기</span>
              </Button>
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-8 w-8 text-pink-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Q&A 관리</h1>
                  <p className="text-sm text-gray-500">사용자 문의사항 관리</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                관리자
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Q&A 검색 및 필터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제목 또는 내용 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 카테고리</option>
                  <option value="qna">Q&A</option>
                  <option value="notice">공지사항</option>
                </select>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>새 FAQ 추가</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Q&A 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Q&A 목록을 불러오는 중...</p>
            </div>
          ) : filteredQAList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">검색 조건에 맞는 Q&A가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredQAList.map((qa) => {
              const isOwnPost = qa.memberId === authInfo?.memberId
              const canDelete = authInfo?.role === "ADMIN" || isOwnPost
              
              return (
                <Card key={qa.id} className={`hover:shadow-md transition-shadow ${isOwnPost ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon()}
                        <div>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <span>{qa.title}</span>
                            {isOwnPost && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                내 글
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            카테고리: {qa.category} | 작성자 ID: {qa.userid} | {qa.createdAt}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge()}
                        <div className="flex space-x-1">
                          {canDelete && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteQA(qa.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">문의 내용:</h4>
                      <p className="text-gray-700">{qa.content}</p>
                      <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-700 text-sm">아직 답변이 등록되지 않았습니다.</p>
                        <Button size="sm" className="mt-2">
                          답변 작성하기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* 통계 요약 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Q&A 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{qaList.length}</div>
                  <div className="text-sm text-blue-800">전체 문의</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{qaList.length}</div>
                  <div className="text-sm text-yellow-800">답변 대기</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default QAAdminPage
