"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Mail, Phone, MapPin, Calendar, Edit3, Save, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { getAuthInfo } from "@/lib/auth-utils"
import { memberService } from "@/lib/member-service"

interface MemberInfo {
  userid: string
  name: string
  email: string
  phone: string
  address: string
  birth: string
}

export default function MyInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [memberData, setMemberData] = useState<MemberInfo | null>(null)
  const [formData, setFormData] = useState({
    userid: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    birth: "",
  })

  // Get user info from localStorage
  const authInfo = getAuthInfo()
  const userId = authInfo?.userId // userId만 추출

  const loadMemberInfo = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await memberService.getMyInfo()
      
      if (response.responseType === "SUCCESS" && response.data) {
        setMemberData(response.data)
        setFormData({
          userid: response.data.userid || "",
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          birth: response.data.birth || "",
        })
      }
    } catch (error) {
      console.error("Failed to load member info:", error)
    } finally {
      setLoading(false)
    }
  }, [userId]) // userId만 의존성으로 사용

  useEffect(() => {
    if (!userId) {
      router.push("/login")
      return
    }
    loadMemberInfo()
  }, [router, userId, loadMemberInfo]) // authInfo 대신 userId 사용

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // 폼 데이터를 원래 데이터로 되돌리기
    if (memberData) {
      setFormData({
        userid: memberData.userid || "",
        name: memberData.name || "",
        email: memberData.email || "",
        phone: memberData.phone || "",
        address: memberData.address || "",
        birth: memberData.birth || "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authInfo?.userId) {
      alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.")
      return
    }

    try {
      setSaving(true)
      // userid는 수정할 수 없는 필드이므로 제외
      const { userid, ...updateData } = formData
      const response = await memberService.updateMyInfo(updateData)
      
      if (response.responseType === "SUCCESS") {
        alert("회원 정보가 수정되었습니다.")
        await loadMemberInfo()
        setIsEditing(false)
      } else {
        alert(response.message || "수정에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to update member info:", error)
      alert("수정에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authInfo?.userId) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-64 p-6 lg:p-8 transition-all duration-300" id="main-content">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">마이페이지</h1>
            <p className="mt-2 text-muted-foreground">회원 정보를 확인하고 수정하세요</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">회원 정보</h2>
                    <p className="text-sm text-muted-foreground">기본 회원 정보를 관리합니다</p>
                  </div>
                </div>
                {!isEditing ? (
                  <Button type="button" onClick={handleEdit} className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    수정하기
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                    <Button type="submit" disabled={saving} className="flex items-center gap-2">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          저장하기
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userid" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      아이디
                    </Label>
                    <Input
                      id="userid"
                      value={formData.userid}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">아이디는 변경할 수 없습니다</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      이름
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                </div>

                {/* 연락처 정보 */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      전화번호
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="전화번호를 입력하세요"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      주소
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!isEditing}
                      placeholder="주소를 입력하세요"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="birth" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      생년월일
                    </Label>
                    <Input
                      id="birth"
                      type="date"
                      value={formData.birth}
                      onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

            </Card>
          </form>
        </div>
      </main>
    </div>
  )
}
