"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X } from "lucide-react"
import { createMenu, updateMenu, type MenuItem } from "@/lib/api-client"

interface MenuDialogProps {
    open: boolean
    onClose: (success: boolean) => void
    menu: MenuItem | null
    storeId: number
}

export function MenuDialog({ open, onClose, menu, storeId }: MenuDialogProps) {
    const [saving, setSaving] = useState(false)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string>("")
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        price: 0,
    })

    useEffect(() => {
        if (menu) {
            setFormData({
                title: menu.title,
                content: menu.content,
                price: menu.price,
            })
            setThumbnailPreview(menu.thumbnail)
            setExistingThumbnailUrl(menu.thumbnail)
            setThumbnailFile(null)
        } else {
            setFormData({
                title: "",
                content: "",
                price: 0,
            })
            setThumbnailPreview("")
            setExistingThumbnailUrl("")
            setThumbnailFile(null)
        }
    }, [menu, open])

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

            setThumbnailFile(file)

            // 미리보기 생성
            const reader = new FileReader()
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleThumbnailRemove = () => {
        setThumbnailFile(null)
        setThumbnailPreview("")
        setExistingThumbnailUrl("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            setSaving(true)

            if (menu) {
                // Update existing menu (파일과 함께 전송)
                // 기존 이미지가 있고 새 이미지를 선택하지 않았으면, 기존 이미지를 다시 전송
                let fileToSend = thumbnailFile
                if (!thumbnailFile && existingThumbnailUrl) {
                    // 기존 이미지를 File 객체로 변환
                    const response = await fetch(existingThumbnailUrl)
                    const blob = await response.blob()
                    const fileName = existingThumbnailUrl.split('/').pop() || 'image.jpg'
                    fileToSend = new File([blob], fileName, { type: blob.type })
                }

                await updateMenu(menu.id, {
                    title: formData.title,
                    content: formData.content,
                    price: formData.price,
                }, fileToSend || undefined)
            } else {
                // Create new menu (파일과 함께 전송)
                await createMenu({
                    storeId,
                    title: formData.title,
                    content: formData.content,
                    price: formData.price,
                }, thumbnailFile || undefined)
            }

            onClose(true)
        } catch (error) {
            console.error("Failed to save menu:", error)
            alert("저장에 실패했습니다.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => onClose(false)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{menu ? "메뉴 수정" : "메뉴 추가"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">메뉴 이름</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">설명</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="price">가격</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) })}
                            required
                        />
                    </div>

                    {/* 메뉴 이미지 첨부 */}
                    <div className="grid gap-2">
                        <Label>메뉴 이미지</Label>
                        {!thumbnailPreview ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                <label className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    이미지 선택
                                    <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <img src={thumbnailPreview} alt="미리보기" className="w-full h-32 object-contain bg-slate-50 rounded-lg border" />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={handleThumbnailRemove}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onClose(false)}>
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
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
