"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getMenusByStore, deleteMenu, type MenuItem } from "@/lib/api-client"
import { getAuthInfo } from "@/lib/auth-utils"
import { MenuDialog } from "@/components/menu-dialog"
import { Sidebar } from "@/components/sidebar"

export default function MenuManagementPage() {
    const [loading, setLoading] = useState(true)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
    const storeId = getAuthInfo()?.storeId

    useEffect(() => {
        loadMenus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeId])

    async function loadMenus() {
        if (!storeId) return
        try {
            setLoading(true)
            const data = await getMenusByStore(storeId)
            setMenuItems(data)
        } catch (error) {
            console.error("Failed to load menus:", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(menuId: number) {
        if (!confirm("정말 삭제하시겠습니까?")) return

        try {
            await deleteMenu(menuId)
            await loadMenus()
        } catch (error) {
            console.error("Failed to delete menu:", error)
            alert("삭제에 실패했습니다.")
        }
    }

    function handleEdit(menu: MenuItem) {
        setEditingMenu(menu)
        setDialogOpen(true)
    }

    function handleAdd() {
        setEditingMenu(null)
        setDialogOpen(true)
    }

    function handleDialogClose(success: boolean) {
        setDialogOpen(false)
        setEditingMenu(null)
        if (success) {
            loadMenus()
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!storeId) {
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
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-balance">메뉴 관리</h1>
                            <p className="mt-2 text-muted-foreground">메뉴를 추가하고 수정하세요</p>
                        </div>
                        <Button onClick={handleAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            메뉴 추가
                        </Button>
                    </div>

                    {menuItems.length === 0 ? (
                        <Card className="p-12 text-center">
                            <p className="text-muted-foreground">등록된 메뉴가 없습니다.</p>
                            <Button onClick={handleAdd} className="mt-4">
                                <Plus className="mr-2 h-4 w-4" />첫 메뉴 추가하기
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {menuItems.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <div className="relative h-40">
                                        <Image src={item.thumbnail || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <div className="mb-2">
                                            <h3 className="text-sm font-semibold">{item.title}</h3>
                                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                                        </div>
                                        <p className="mt-2 text-base font-bold">{item.price.toLocaleString()}원</p>
                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent text-xs h-8"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="mr-1 h-3 w-3" />
                                                수정
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <MenuDialog open={dialogOpen} onClose={handleDialogClose} menu={editingMenu} storeId={storeId} />
        </div>
    )
}
