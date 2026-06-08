"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Payment } from "@/generated/prisma"
import { type PaymentCreate } from "@/lib/validations"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentForm } from "./payment-form"
import { Input } from "@/components/ui/input"

interface Props {
  onAdd?: () => void
}

export function PaymentList({ onAdd }: Props) {
  const [items, setItems] = useState<Payment[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({})
  const [subsMap, setSubsMap] = useState<Record<string, string>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<Payment | null>(null)
  const [filterCustomerId, setFilterCustomerId] = useState<string | undefined>(undefined)
  const [filterSubscriptionId, setFilterSubscriptionId] = useState<string | undefined>(undefined)
  const [dueFrom, setDueFrom] = useState("")
  const [dueTo, setDueTo] = useState("")
  const [currency, setCurrency] = useState<string | undefined>(undefined)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (status) params.set("status", status)
      if (filterCustomerId) params.set("customerId", filterCustomerId)
      if (filterSubscriptionId) params.set("subscriptionId", filterSubscriptionId)
      if (dueFrom) params.set("dueDateFrom", dueFrom)
      if (dueTo) params.set("dueDateTo", dueTo)
      if (currency) params.set("currency", currency)
      const res = await fetch(`/api/payments?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Ödemeler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, filterCustomerId, filterSubscriptionId, dueFrom, dueTo, currency])

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const cRes = await fetch(`/api/customers?limit=100`)
        if (cRes.ok) {
          const cData = await cRes.json()
          const cItems = cData.data || []
          const map: Record<string, string> = {}
          for (const c of cItems) map[c.id] = c.fullName
          setCustomersMap(map)
        }
      } catch {}
      try {
        const sRes = await fetch(`/api/subscriptions?limit=100`)
        if (sRes.ok) {
          const sData = await sRes.json()
          const sItems = sData.data || []
          const map: Record<string, string> = {}
          for (const s of sItems) map[s.id] = s.name
          setSubsMap(map)
        }
      } catch {}
    }
    loadMaps()
  }, [])

  const handleStatusChange = (v: string) => {
    setStatus(v)
    setPage(1)
    fetchData()
  }

  const handleFiltersReset = () => {
    setFilterCustomerId(undefined)
    setFilterSubscriptionId(undefined)
    setDueFrom("")
    setDueTo("")
    setCurrency(undefined)
    setStatus(undefined)
    setPage(1)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    const ok = typeof window !== 'undefined' ? window.confirm('Bu ödemeyi silmek istediğinizden emin misiniz?') : true
    if (!ok) return
    try {
      const res = await fetch(`/api/payments?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silme başarısız')
      toast.success('Ödeme silindi')
      fetchData()
    } catch {
      toast.error('Ödeme silinemedi')
    }
  }

  const openEdit = (item: Payment) => {
    setEditItem(item)
    setEditOpen(true)
  }

  const handleEditSubmit = async (data: Partial<PaymentCreate>) => {
    if (!editItem) return
    try {
      const res = await fetch(`/api/payments?id=${encodeURIComponent(editItem.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Güncelleme başarısız')
      toast.success('Ödeme güncellendi')
      setEditOpen(false)
      setEditItem(null)
      fetchData()
    } catch {
      toast.error('Ödeme güncellenemedi')
    }
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ödemeler</h2>
        <Button onClick={onAdd}>Yeni Ödeme</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={filterCustomerId} onValueChange={(v) => { setFilterCustomerId(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Müşteri" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(customersMap).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubscriptionId} onValueChange={(v) => { setFilterSubscriptionId(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Abonelik" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(subsMap).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DUE">Ödenecek</SelectItem>
                <SelectItem value="LATE">Gecikmiş</SelectItem>
                <SelectItem value="PAID">Ödendi</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={dueFrom} onChange={(e) => { setDueFrom(e.target.value); setPage(1) }} placeholder="Vade Başlangıç" />
            <Input type="date" value={dueTo} onChange={(e) => { setDueTo(e.target.value); setPage(1) }} placeholder="Vade Bitiş" />

            <Select value={currency} onValueChange={(v) => { setCurrency(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Para Birimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-3">
            <Button variant="outline" size="sm" onClick={handleFiltersReset}>Filtreleri Temizle</Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Abonelik</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Para Birimi</TableHead>
              <TableHead>Vade</TableHead>
              <TableHead>Ödendi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Not</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{customersMap[p.customerId] || p.customerId}</TableCell>
                <TableCell>{p.subscriptionId ? (subsMap[p.subscriptionId] || p.subscriptionId) : "—"}</TableCell>
                <TableCell>{p.amount}</TableCell>
                <TableCell>{p.currency === "TRY" ? "TL" : p.currency}</TableCell>
                <TableCell>{new Date(p.dueDate).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell>{p.paidDate ? new Date(p.paidDate).toLocaleDateString("tr-TR") : "—"}</TableCell>
                <TableCell>{p.status === "DUE" ? "Ödenecek" : p.status === "LATE" ? "Gecikmiş" : "Ödendi"}</TableCell>
                <TableCell>{p.note || ""}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Düzenle</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Sil</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500 py-6">Kayıt bulunamadı</TableCell>
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
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ödeme Düzenle</DialogTitle>
        </DialogHeader>
        {editItem ? (
          <PaymentForm
            embedded
            onCancel={() => { setEditOpen(false); setEditItem(null) }}
            onSuccess={() => {}}
            onSubmit={handleEditSubmit}
            initial={{
              customerId: editItem.customerId,
              subscriptionId: editItem.subscriptionId || undefined,
              amount: editItem.amount,
              currency: editItem.currency,
              dueDate: new Date(editItem.dueDate).toISOString().slice(0,10),
              paidDate: editItem.paidDate ? new Date(editItem.paidDate).toISOString().slice(0,10) : undefined,
              status: editItem.status as 'DUE' | 'LATE' | 'PAID',
              note: editItem.note || undefined,
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  )
}
