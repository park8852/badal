"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Store, Clock, Phone, MapPin, Upload, X, LogOut, LogIn } from "lucide-react"
import { createStore, uploadFile, type CreateStoreRequest } from "@/lib/api-client"
import { getAuthInfo, setAuthInfo, clearAuthInfo } from "@/lib/auth-utils"
import Image from "next/image"

export default function StoreCreatePage() {
    const router = useRouter()
    const [authInfo, setLocalAuthInfo] = useState<any>(null)
    const [isClient, setIsClient] = useState(false)
    const [form, setForm] = useState({
        name: "",
        category: "중국집",
        phone: "",
        address: "",
        opentime: "09:00",
        endtime: "23:00",
    })
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ type: string; message: string; data?: any } | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // 클라이언트 사이드에서만 authInfo 로드
    useEffect(() => {
        setIsClient(true)
        setLocalAuthInfo(getAuthInfo())
    }, [])

    // 로그아웃 핸들러
    const handleLogout = () => {
        clearAuthInfo()
        router.push("/login")
    }

    const categories = [
        "한식",
        "일식",
        "중식",
        "분식",
        "양식",
        "치킨",
        "피자",
        "카페/디저트",
    ]

    function validate(values: typeof form) {
        const e: Record<string, string> = {}
        if (!values.name.trim()) e.name = "가게명을 입력해주세요."
        if (!values.category) e.category = "카테고리를 선택해주세요."
        if (!values.phone.trim()) e.phone = "연락처를 입력해주세요."

        const phoneClean = values.phone.replace(/[-\s]/g, "")
        if (!/^01[016789][0-9]{7,8}$/.test(phoneClean)) {
            e.phone = "휴대폰 번호 형식이 올바르지 않습니다."
        }
        if (!values.address.trim()) e.address = "주소를 입력해주세요."
        if (!values.opentime) e.opentime = "오픈 시간을 설정하세요."
        if (!values.endtime) e.endtime = "마감 시간을 설정하세요."

        if (values.opentime && values.endtime) {
            const [oh, om] = values.opentime.split(":").map(Number)
            const [eh, em] = values.endtime.split(":").map(Number)
            const o = oh * 60 + om
            const d = eh * 60 + em
            if (o !== d && d < o) {
                e.endtime = "마감이 오픈보다 이른 경우 자정 넘김 영업인지 확인하세요."
            }
        }
        return e
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        // Small UX nicety: auto-format phone as 010-1234-5678 while typing
        if (name === "phone") {
            const digits = value.replace(/\D/g, "")
            let formatted = digits
            if (digits.length > 3 && digits.length <= 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
            } else if (digits.length > 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
            }
            setForm((prev) => ({ ...prev, [name]: formatted }))
            return
        }

        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleCategoryChange = (value: string) => {
        setForm((prev) => ({ ...prev, category: value }))
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                alert("파일 크기는 5MB 이하여야 합니다.")
                return
            }

            // 이미지 파일 타입 체크
            if (!file.type.startsWith("image/")) {
                alert("이미지 파일만 업로드 가능합니다.")
                return
            }

            setLogoFile(file)

            // 미리보기 생성
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleLogoRemove = () => {
        setLogoFile(null)
        setLogoPreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const v = validate(form)
        setErrors(v)
        if (Object.keys(v).length > 0) return

        setLoading(true)
        setResult(null)

        try {
            // 시간 정보를 분리하여 API 요청 형태로 변환
            const [openH, openM] = form.opentime.split(":").map(Number)
            const [closedH, closedM] = form.endtime.split(":").map(Number)

            const requestData: CreateStoreRequest = {
                name: form.name,
                category: form.category,
                phone: form.phone,
                address: form.address,
                openH: openH,
                openM: openM,
                closedH: closedH,
                closedM: closedM,
                createdAt: new Date().toISOString().split("T")[0], // 현재 날짜를 YYYY-MM-DD 형태로
            }

            // ⭐ 파일과 정보를 한 번에 전송!
            const data = await createStore(requestData, logoFile || undefined)

            setResult({
                type: "SUCCESS",
                message: "가게가 성공적으로 등록되었습니다." + (logoFile ? " 로고도 함께 등록되었습니다." : ""),
                data: data,
            })

            // 스토어 생성 성공 시 storeId 반영 (응답의 data.id가 storeId)
            const createdStoreId: number | undefined = typeof data?.id === "number" ? data.id : undefined

            const current = getAuthInfo()
            if (current?.token && createdStoreId !== undefined) {
                // localStorage에 저장
                setAuthInfo({
                    token: current.token,
                    userId: current.userId,
                    role: current.role,
                    storeId: createdStoreId,
                })
                // 로컬 state도 업데이트
                setLocalAuthInfo({
                    token: current.token,
                    userId: current.userId,
                    role: current.role,
                    storeId: createdStoreId,
                })
            }

            // 성공 후 대시보드로 이동
            setTimeout(() => {
                router.push("/dashboard")
            }, 1200)
        } catch (err: any) {
            setResult({
                type: "FAIL",
                message: err.message || "네트워크 오류가 발생했습니다.",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setForm({ name: "", category: "중국집", phone: "", address: "", opentime: "09:00", endtime: "23:00" })
        setLogoFile(null)
        setLogoPreview(null)
        setErrors({})
        setResult(null)
    }

    const openDuration = useMemo(() => {
        if (!form.opentime || !form.endtime) return "—"
        const [oh, om] = form.opentime.split(":").map(Number)
        const [eh, em] = form.endtime.split(":").map(Number)
        let start = oh * 60 + om
        let end = eh * 60 + em
        if (end < start) end += 24 * 60 // cross midnight
        const h = Math.floor((end - start) / 60)
        const m = (end - start) % 60
        return `${h}시간 ${m ? m + "분" : ""}`.trim()
    }, [form.opentime, form.endtime])

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Top bar */}
            <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                    {/* 로고 - 홈으로 리다이렉션 */}
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <Image
                                src="/logo_black.png"
                                alt="바로배달 로고"
                                width={120}
                                height={30}
                                className="object-contain"
                            />
                        </button>
                    </div>

                    {/* 로그인/로그아웃 버튼 */}
                    <div className="flex items-center">
                        {isClient && authInfo ? (
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="px-6 flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                로그아웃
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => router.push("/login")}
                                className="px-6 flex items-center gap-2"
                            >
                                <LogIn className="h-4 w-4" />
                                로그인
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8">
                {/* Layout: Form (2) + Preview (1) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <section className="md:col-span-2">
                        <Card>
                            <div className="border-b px-6 py-4">
                                <h2 className="font-semibold">기본 정보</h2>
                                <p className="text-sm text-muted-foreground">사업자 정보와 연락처를 정확히 입력해주세요.</p>
                            </div>

                            {result && (
                                <div className="mx-6 mt-6">
                                    <Alert className={result.type === "SUCCESS" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                                        <AlertDescription>
                                            <strong>{result.type === "SUCCESS" ? "성공" : "실패"}</strong>: {result.message}
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* name */}
                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>가게명 *</span>
                                            {errors.name && <span className="text-red-500">{errors.name}</span>}
                                        </Label>
                                        <Input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="예) 남탕가게"
                                            className={errors.name ? "border-red-400" : ""}
                                        />
                                    </div>

                                    {/* category */}
                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>카테고리 *</span>
                                            {errors.category && <span className="text-red-500">{errors.category}</span>}
                                        </Label>
                                        <Select value={form.category} onValueChange={handleCategoryChange}>
                                            <SelectTrigger className={`w-full ${errors.category ? "border-red-400" : ""}`}>
                                                <SelectValue placeholder="카테고리를 선택하세요" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* phone */}
                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>연락처(휴대폰) *</span>
                                            {errors.phone && <span className="text-red-500">{errors.phone}</span>}
                                        </Label>
                                        <Input
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="010-1234-5678"
                                            inputMode="numeric"
                                            className={errors.phone ? "border-red-400" : ""}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">숫자만 입력해도 자동으로 하이픈이 들어가요.</p>
                                    </div>

                                    {/* address */}
                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>주소 *</span>
                                            {errors.address && <span className="text-red-500">{errors.address}</span>}
                                        </Label>
                                        <Input
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="예) 서울특별시 중구 …"
                                            className={errors.address ? "border-red-400" : ""}
                                        />
                                    </div>

                                    {/* open / end time */}
                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>오픈 시간 *</span>
                                            {errors.opentime && <span className="text-red-500">{errors.opentime}</span>}
                                        </Label>
                                        <Input
                                            type="time"
                                            name="opentime"
                                            value={form.opentime}
                                            onChange={handleChange}
                                            className={errors.opentime ? "border-red-400" : ""}
                                        />
                                    </div>

                                    <div>
                                        <Label className="flex items-center justify-between text-sm font-medium mb-2">
                                            <span>마감 시간 *</span>
                                            {errors.endtime && <span className="text-red-500">{errors.endtime}</span>}
                                        </Label>
                                        <Input
                                            type="time"
                                            name="endtime"
                                            value={form.endtime}
                                            onChange={handleChange}
                                            className={errors.endtime ? "border-red-400" : ""}
                                        />
                                    </div>
                                </div>

                                {/* actions */}
                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                등록 중…
                                            </div>
                                        ) : (
                                            "가게 등록"
                                        )}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleReset}>
                                        초기화
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </section>

                    {/* Live preview card */}
                    <aside className="md:col-span-1">
                        <div className="sticky top-20 space-y-6">
                            <Card>
                                <div className="px-5 py-4 border-b flex items-center justify-between">
                                    <h3 className="font-semibold">미리보기</h3>
                                    <span className="text-xs text-muted-foreground">영업 {openDuration}</span>
                                </div>
                                <div className="p-5">
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-lg font-semibold">{form.name || "가게명"}</h4>
                                                <p className="text-sm text-muted-foreground mt-0.5">{form.category}</p>
                                            </div>
                                            <div className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1">NEW</div>
                                        </div>
                                        <div className="mt-4 space-y-2 text-sm">
                                            <p className="flex gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-foreground">{form.address || "주소"}</span>
                                            </p>
                                            <p className="flex gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-foreground">{form.phone || "010-0000-0000"}</span>
                                            </p>
                                            <p className="flex gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-foreground">
                          {form.opentime} ~ {form.endtime}
                        </span>
                                            </p>
                                        </div>
                                    </div>

                                    {Object.keys(errors).length > 0 && (
                                        <Alert className="mt-4 border-amber-200 bg-amber-50">
                                            <AlertDescription className="text-amber-800">
                                                입력값을 확인해주세요: {Object.values(errors).join(" · ")}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </Card>

                            {/* 로고 등록 폼 */}
                            <Card>
                                <div className="px-5 py-4 border-b">
                                    <h3 className="font-semibold">가게 로고</h3>
                                    <p className="text-xs text-muted-foreground mt-1">가게를 대표할 로고 이미지를 등록하세요.</p>
                                </div>
                                <div className="p-5">
                                    {!logoPreview ? (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                                            <div className="flex flex-col items-center">
                                                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                                                <p className="text-sm font-medium text-foreground mb-2">로고 이미지 업로드</p>
                                                <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">
                                                    <Upload className="w-4 h-4" />
                                                    파일 선택
                                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <img
                                                    src={logoPreview}
                                                    alt="로고 미리보기"
                                                    className="w-full h-32 object-contain bg-slate-50 rounded-xl border"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    className="absolute top-2 right-2 h-8 w-8 p-0"
                                                    onClick={handleLogoRemove}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>파일명: {logoFile?.name}</span>
                                                <span>크기: {logoFile ? (logoFile.size / 1024 / 1024).toFixed(2) : 0}MB</span>
                                            </div>
                                            <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                                                <Upload className="w-4 h-4" />
                                                다른 이미지 선택
                                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    )
}