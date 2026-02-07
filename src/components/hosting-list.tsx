"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Hosting } from "@/generated/prisma"
import { toast } from "sonner"

interface Props {
  onAdd?: () => void
}

export function HostingList({ onAdd }: Props) {
  const [items, setItems] = useState<Hosting[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/hosting?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Hostingler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hostingler</h2>
        <Button onClick={onAdd}>Yeni Hosting</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Ara" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outline" onClick={handleSearch}>Ara</Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paket</TableHead>
              <TableHead>Sunucu</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Bitiş</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{h.package}</TableCell>
                <TableCell>{h.server}</TableCell>
                <TableCell>{h.ip}</TableCell>
                <TableCell>{new Date(h.endDate).toLocaleDateString("tr-TR")}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-6">Kayıt bulunamadı</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-center gap-3 p-3 border-t">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Önceki</Button>
          <span className="text-sm text-gray-600">Sayfa {page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Sonraki</Button>
        </div>
      </div>
    </div>
  )
}