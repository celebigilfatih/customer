"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type PaymentCreate } from "@/lib/validations"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentForm } from "./payment-form"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Filter, Pencil, Trash2, X } from "lucide-react"

type PaymentStatus = "DUE" | "LATE" | "PAID"

type PaymentListItem = {
  id: string
  customerId: string
  invoiceId?: string | null
  subscriptionId?: string | null
  amount: string | number
  taxExcludedAmount?: string | number | null
  currency: string
  dueDate: string | Date | null
  paidDate: string | Date | null
  status: PaymentStatus
  note: string | null
  sourceLabel?: string | null
  sourceReference?: string | null
}

const ALL_FILTER_VALUE = "__all"

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("tr-TR")
}

const formatAmount = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—"
  return Number(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const toDateInputValue = (value: string | Date | null | undefined) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
}

export function PaymentList() {
  const [items, setItems] = useState<PaymentListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({})
  const [subsMap, setSubsMap] = useState<Record<string, string>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<PaymentListItem | null>(null)
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
    setStatus(v === ALL_FILTER_VALUE ? undefined : v)
    setPage(1)
  }

  const handleFiltersReset = () => {
    setFilterCustomerId(undefined)
    setFilterSubscriptionId(undefined)
    setDueFrom("")
    setDueTo("")
    setCurrency(undefined)
    setStatus(undefined)
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    filterCustomerId || filterSubscriptionId || status || dueFrom || dueTo || currency
  )

  const handleDelete = async (payment: PaymentListItem) => {
    const confirmationMessage = payment.invoiceId
      ? 'Bu tahsilatı ve bağlı faturayı silmek istediğinizden emin misiniz? Stoklu ürün varsa stok geri alınır.'
      : 'Bu tahsilatı silmek istediğinizden emin misiniz?'
    const ok = typeof window !== 'undefined' ? window.confirm(confirmationMessage) : true
    if (!ok) return
    try {
      const res = await fetch(`/api/payments?id=${encodeURIComponent(payment.id)}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Silme başarısız')
      toast.success(payload?.deletedInvoiceId ? 'Tahsilat ve bağlı fatura silindi' : 'Tahsilat silindi')
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ödeme silinemedi')
    }
  }

  const openEdit = (item: PaymentListItem) => {
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
    <div className="space-y-3">
      <div className="rounded-lg border bg-white">
        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Tahsilatlar</h2>
            <p className="text-xs text-muted-foreground">Ödeme kayıtlarını filtreleyin ve yönetin</p>
          </div>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleFiltersReset}>
              <X className="mr-2 h-4 w-4" />
              Temizle
            </Button>
          ) : null}
        </div>
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex h-9 shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtrele
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Select
              value={filterCustomerId || ALL_FILTER_VALUE}
              onValueChange={(v) => { setFilterCustomerId(v === ALL_FILTER_VALUE ? undefined : v); setPage(1) }}
            >
              <SelectTrigger className="h-9 w-full bg-white sm:w-[180px]">
                <SelectValue placeholder="Müşteri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Müşteri</SelectItem>
                {Object.entries(customersMap).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterSubscriptionId || ALL_FILTER_VALUE}
              onValueChange={(v) => { setFilterSubscriptionId(v === ALL_FILTER_VALUE ? undefined : v); setPage(1) }}
            >
              <SelectTrigger className="h-9 w-full bg-white sm:w-[180px]">
                <SelectValue placeholder="Kaynak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Kaynak</SelectItem>
                {Object.entries(subsMap).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status || ALL_FILTER_VALUE} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 w-full bg-white sm:w-[140px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Durum</SelectItem>
                <SelectItem value="DUE">Ödenecek</SelectItem>
                <SelectItem value="LATE">Gecikmiş</SelectItem>
                <SelectItem value="PAID">Ödendi</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currency || ALL_FILTER_VALUE}
              onValueChange={(v) => { setCurrency(v === ALL_FILTER_VALUE ? undefined : v); setPage(1) }}
            >
              <SelectTrigger className="h-9 w-full bg-white sm:w-[120px]">
                <SelectValue placeholder="Birim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>Birim</SelectItem>
                <SelectItem value="TRY">TL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>

              <div className="flex w-full flex-col overflow-hidden rounded-md border bg-white sm:w-auto sm:flex-row sm:items-center">
                <div className="flex h-9 items-center border-b px-3 text-xs font-medium text-muted-foreground sm:border-b-0 sm:border-r">
                  Vade
                </div>
                <Input
                  className="h-9 rounded-none border-0 bg-white shadow-none focus-visible:ring-0 sm:w-[150px]"
                  type="date"
                  value={dueFrom}
                  onChange={(e) => { setDueFrom(e.target.value); setPage(1) }}
                  aria-label="Vade başlangıç"
                />
                <div className="hidden h-5 w-px bg-border sm:block" />
                <Input
                  className="h-9 rounded-none border-0 bg-white shadow-none focus-visible:ring-0 sm:w-[150px]"
                  type="date"
                  value={dueTo}
                  onChange={(e) => { setDueTo(e.target.value); setPage(1) }}
                  aria-label="Vade bitiş"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tahsilat Kaynağı</TableHead>
              <TableHead>KDV Hariç Fiyat</TableHead>
              <TableHead>KDV Dahil Tutar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead>Vade Tarihi</TableHead>
              <TableHead>Ödeme Tarihi</TableHead>
              <TableHead>Ödeme Durumu</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{customersMap[p.customerId] || p.customerId}</TableCell>
                <TableCell>
                  <div className="max-w-[280px]">
                    <div className="truncate font-medium">
                      {p.sourceLabel || (p.subscriptionId ? (subsMap[p.subscriptionId] || p.subscriptionId) : "—")}
                    </div>
                    {p.sourceReference ? (
                      <div className="text-xs text-muted-foreground">{p.sourceReference}</div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatAmount(p.taxExcludedAmount ?? p.amount)}</TableCell>
                <TableCell>{formatAmount(p.amount)}</TableCell>
                <TableCell>{p.currency === "TRY" ? "TL" : p.currency}</TableCell>
                <TableCell>{formatDate(p.dueDate)}</TableCell>
                <TableCell>{formatDate(p.paidDate)}</TableCell>
                <TableCell>{p.status === "DUE" ? "Ödenecek" : p.status === "LATE" ? "Gecikmiş" : "Ödendi"}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={150}>
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Ödemeyi düzenle"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Düzenle</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Ödemeyi sil"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sil</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
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
              amount: String(editItem.amount),
              currency: editItem.currency,
              dueDate: toDateInputValue(editItem.dueDate) || "",
              paidDate: toDateInputValue(editItem.paidDate),
              status: editItem.status,
              note: editItem.note || undefined,
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  )
}
