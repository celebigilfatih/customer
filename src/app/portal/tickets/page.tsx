"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { routes } from "@/lib/routes"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { toast } from "sonner"

type TaskItem = { id: string; title: string; description: string; status: string }

function getPortalCustomerId(): string | null {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    const u = JSON.parse(raw) as { customerId?: string }
    return u.customerId || null
  } catch {
    return null
  }
}

export default function PortalTicketsPage() {
  const [items, setItems] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = getPortalCustomerId()
    if (!id) {
      toast.error("Müşteri bilgisi bulunamadı")
      return
    }
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/tasks?limit=100&customerId=${encodeURIComponent(id)}`)
        if (!res.ok) throw new Error("Veri alınamadı")
        const data = await res.json()
        setItems(data.data || [])
      } catch {
        toast.error("Talepler yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 items-center">
        <BackButton size="sm" fallbackHref={routes.portal.dashboard} className="hover:bg-gray-100" />
        <div className="col-span-3">
          <h1 className="text-2xl font-bold">Talepler</h1>
        </div>
      </div>
      <Card className="border">
        <CardHeader>
          <CardTitle>Liste</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
          {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell className="text-gray-700">{t.description}</TableCell>
                    <TableCell>{t.status}</TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-6">Kayıt bulunamadı</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
