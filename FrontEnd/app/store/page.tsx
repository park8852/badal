"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { getStoreInfo, updateStoreInfo, type StoreInfo } from "@/lib/api-client"
import { Loader2, Upload, X, Clock, CheckCircle, XCircle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { BusinessStatusDisplay } from "@/components/business-status-display"
import Image from "next/image"
import { getAuthInfo } from "@/lib/auth-utils"
import useSWR from "swr"

export default function StoreManagementPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [storeData, setStoreData] = useState<StoreInfo | null>(null)
    const [formData, setFormData] = useState({
        category: "",
        name: "",
        address: "",
        phone: "",
        openH: 9,
        openM: 0,
        closedH: 21,
        closedM: 0,
        thumbnail: "",
    })
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string>("")
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string>("")

    const defaultCategories = [
        "한식",
        "일식",
        "중식",
        "분식",
        "양식",
        "치킨",
        "피자",
        "카페/디저트",
    ]

    // 현재 카테고리가 기본 목록에 없으면 추가
    const categories = formData.category && !defaultCategories.includes(formData.category)
        ? [formData.category, ...defaultCategories]
        : defaultCategories

    // Get store ID from localStorage
    const authInfo = getAuthInfo()
    const storeId = authInfo?.storeId

    useEffect(() => {
        if (storeId) {
            loadStoreInfo()
        }
    }, [storeId])

    async function loadStoreInfo() {
        if (!storeId) {
            console.error("Store ID not found in localStorage")
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await getStoreInfo(storeId)
            setStoreData(data)
            setFormData({
                category: data.category,
                name: data.name,
                address: data.address,
                phone: data.phone,
                openH: data.openH,
                openM: data.openM,
                closedH: data.closedH,
                closedM: data.closedM,
                thumbnail: data.thumbnail || "",
            })
            setLogoPreview(data.thumbnail || "")
            setExistingThumbnailUrl(data.thumbnail || "")
        } catch (error) {
            console.error("Failed to load store info:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveLogo = () => {
        setLogoFile(null)
        setLogoPreview("")
        setExistingThumbnailUrl("")
        setFormData({ ...formData, thumbnail: "" })
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        // 폼 데이터를 원래 데이터로 되돌리기
        if (storeData) {
            setFormData({
                category: storeData.category,
                name: storeData.name,
                address: storeData.address,
                phone: storeData.phone,
                openH: storeData.openH,
                openM: storeData.openM,
                closedH: storeData.closedH,
                closedM: storeData.closedM,
                thumbnail: storeData.thumbnail || "",
            })
            setLogoPreview(storeData.thumbnail || "")
            setExistingThumbnailUrl(storeData.thumbnail || "")
        }
        setLogoFile(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!storeId) {
            alert("가게 ID를 찾을 수 없습니다. 다시 로그인해주세요.")
            return
        }

        try {
            setSaving(true)
            // logo 필드를 제외하고 API 요청
            const { thumbnail, ...updateData } = formData

            // 기존 이미지가 있고 새 이미지를 선택하지 않았으면, 기존 이미지를 다시 전송
            let fileToSend = logoFile
            if (!logoFile && existingThumbnailUrl) {
                try {
                    // 기존 이미지를 File 객체로 변환
                    const response = await fetch(existingThumbnailUrl)
                    const blob = await response.blob()
                    const fileName = existingThumbnailUrl.split('/').pop() || 'image.jpg'
                    fileToSend = new File([blob], fileName, { type: blob.type })
                } catch (error) {
                    console.error("Failed to convert existing image to file:", error)
                    // 변환 실패 시 그냥 진행
                }
            }

            await updateStoreInfo(storeId, updateData, fileToSend || undefined)
            alert("가게 정보가 저장되었습니다.")
            await loadStoreInfo()
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update store info:", error)
            alert("저장에 실패했습니다.")
        } finally {
            setSaving(false)
        }
    }

    if (!storeId || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className="lg:ml-64 p-6 lg:p-8 transition-all duration-300" id="main-content">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-balance">가게 관리</h1>
                            <p className="mt-2 text-muted-foreground">가게 정보와 운영 설정을 관리하세요</p>
                        </div>
                        <BusinessStatusDisplay />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 기본 정보와 우측 섹션을 나란히 배치 */}
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                            {/* 기본 정보 카드 - 좌측 (7/10) */}
                            <Card className="p-6 lg:col-span-7">
                                <h2 className="mb-6 text-xl font-semibold">기본 정보</h2>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">카테고리</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={formData.category || "카테고리를 선택하세요"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="storeName">가게 이름</Label>
                                        <Input
                                            id="storeName"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">전화번호</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address">주소</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* 우측 섹션 - 운영시간과 가게 로고 (3/10) */}
                            <div className="flex flex-col lg:col-span-3 h-full gap-6">
                                {/* 운영 시간 카드 (6/10) */}
                                <Card className="p-6 flex-[6]">
                                    <h2 className="mb-2 text-xl font-semibold">운영 시간</h2>
                                    <div className="space-y-4">
                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <Label>오픈 시간</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="23"
                                                        value={formData.openH}
                                                        onChange={(e) => setFormData({ ...formData, openH: Number.parseInt(e.target.value) })}
                                                        placeholder="시"
                                                        disabled={!isEditing}
                                                    />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="59"
                                                        value={formData.openM}
                                                        onChange={(e) => setFormData({ ...formData, openM: Number.parseInt(e.target.value) })}
                                                        placeholder="분"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>마감 시간</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="23"
                                                        value={formData.closedH}
                                                        onChange={(e) => setFormData({ ...formData, closedH: Number.parseInt(e.target.value) })}
                                                        placeholder="시"
                                                        disabled={!isEditing}
                                                    />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="59"
                                                        value={formData.closedM}
                                                        onChange={(e) => setFormData({ ...formData, closedM: Number.parseInt(e.target.value) })}
                                                        placeholder="분"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* 가게 로고 카드 (4/10) */}
                                <Card className="p-6 flex-[4]">
                                    <h2 className="mb-1 text-xl font-semibold">가게 로고</h2>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex-shrink-0">
                                            {logoPreview ? (
                                                <div className="relative">
                                                    <Image
                                                        src={logoPreview}
                                                        alt="가게 로고"
                                                        width={120}
                                                        height={120}
                                                        className="rounded-lg object-cover border-2 border-gray-200"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                        onClick={handleRemoveLogo}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="w-30 h-30 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                                    <Upload className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full">
                                            <Input
                                                id="logo"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="mb-2"
                                                disabled={!isEditing}
                                            />

                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            {!isEditing ? (
                                <Button type="button" onClick={handleEdit}>
                                    수정하기
                                </Button>
                            ) : (
                                <>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        취소
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            "저장하기"
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
