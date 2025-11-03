"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import { 
  getNoticeList, 
  NoticeItem, 
  createNotice, 
  updateNotice, 
  deleteNotice, 
  CreateNoticeRequest,
  UpdateNoticeRequest 
} from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  LogOut,
  Shield,
  Megaphone,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User
} from "lucide-react"

const NoticeAdminPage = () => {
  const router = useRouter()
  const [authInfo, setAuthInfo] = useState(getAuthInfo())
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createContent, setCreateContent] = useState("")

  useEffect(() => {
    // 인증 확인
    if (!authInfo || authInfo.role !== "ADMIN") {
      router.replace("/login")
      return
    }

    // 공지사항 데이터 로드
    loadNoticeList()
  }, [authInfo, router])

  const loadNoticeList = async () => {
    try {
      setIsLoading(true)
      // API에서 공지사항 데이터 가져오기
      const noticeData = await getNoticeList()
      setNoticeList(noticeData)
    } catch (error) {
      console.error("공지사항 목록 로드 실패:", error)
      setNoticeList([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthInfo()
    router.replace("/login")
  }

  const handleCreateNotice = async () => {
    if (!createTitle.trim() || !createContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.")
      return
    }

    try {
      const createData: CreateNoticeRequest = {
        category: "notice",
        title: createTitle,
        content: createContent
      }

      await createNotice(createData)
      
      // 생성 성공 시 목록 새로고침
      await loadNoticeList()
      
      // 생성 폼 초기화
      setIsCreating(false)
      setCreateTitle("")
      setCreateContent("")
      
      alert("공지사항이 성공적으로 작성되었습니다.")
    } catch (error) {
      console.error("공지사항 작성 실패:", error)
      alert("공지사항 작성에 실패했습니다.")
    }
  }

  const handleEditNotice = async (noticeId: number) => {
    const notice = noticeList.find(item => item.id === noticeId)
    if (notice) {
      setEditingNotice(notice)
      setEditTitle(notice.title)
      setEditContent(notice.content)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingNotice) return

    try {
      const updateData: UpdateNoticeRequest = {
        id: null, // URL에서 받은 값
        category: editingNotice.category,
        memberId: null, // 서버에서 처리
        title: editTitle,
        content: editContent,
        createdAt: null // 서버에서 처리
      }

      await updateNotice(editingNotice.id, updateData)
      
      // 수정 성공 시 목록 새로고침
      await loadNoticeList()
      
      // 모달 닫기
      setEditingNotice(null)
      setEditTitle("")
      setEditContent("")
      
      alert("공지사항이 성공적으로 수정되었습니다.")
    } catch (error) {
      console.error("공지사항 수정 실패:", error)
      alert("공지사항 수정에 실패했습니다.")
    }
  }

  const handleCancelEdit = () => {
    setEditingNotice(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleDeleteNotice = async (noticeId: number) => {
    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
      return
    }

    try {
      await deleteNotice(noticeId)
      // 삭제 성공 시 목록 새로고침
      await loadNoticeList()
      alert("공지사항이 성공적으로 삭제되었습니다.")
    } catch (error) {
      console.error("공지사항 삭제 실패:", error)
      alert("공지사항 삭제에 실패했습니다.")
    }
  }

  const filteredNoticeList = noticeList.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
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
                <Megaphone className="h-8 w-8 text-indigo-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">공지사항 관리</h1>
                  <p className="text-sm text-gray-500">시스템 공지사항 관리</p>
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
              <CardTitle>공지사항 검색 및 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제목 또는 내용 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  className="flex items-center space-x-2"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>새 공지사항 작성</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 공지사항 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">공지사항 목록을 불러오는 중...</p>
            </div>
          ) : filteredNoticeList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">검색 조건에 맞는 공지사항이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredNoticeList.map((notice) => (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Megaphone className="h-5 w-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>작성자: {notice.userid}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{notice.createdAt}</span>
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                        공지사항
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditNotice(notice.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteNotice(notice.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">공지 내용:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 통계 요약 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>공지사항 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{noticeList.length}</div>
                  <div className="text-sm text-indigo-800">전체 공지사항</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 생성 모달 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>새 공지사항 작성</CardTitle>
              <CardDescription>
                새로운 공지사항을 작성할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">제목</label>
                <Input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">내용</label>
                <Textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  className="mt-1 min-h-[200px]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCreating(false)
                  setCreateTitle("")
                  setCreateContent("")
                }}>
                  취소
                </Button>
                <Button onClick={handleCreateNotice}>
                  작성
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 수정 모달 */}
      {editingNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>공지사항 수정</CardTitle>
              <CardDescription>
                공지사항 제목과 내용을 수정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">제목</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">내용</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  className="mt-1 min-h-[200px]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button onClick={handleSaveEdit}>
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default NoticeAdminPage