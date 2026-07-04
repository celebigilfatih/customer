"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Subscription, $Enums } from "@/generated/prisma"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubscriptionForm } from "@/components/subscription-form"
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash, Search, Plus, Repeat, Calendar, DollarSign, Filter, RefreshCw, User } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import Link from "next/link"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

interface Props {
  onAdd?: () => void
}

type SubscriptionRow = Subscription & { customer?: { fullName: string } }
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function SubscriptionList({ onAdd }: Props) {
  const [items, setItems] = useState<SubscriptionRow[]>([])
  const [search, setSearch] = useState("")
  const [type, setType] = useState("ALL")
  const [period, setPeriod] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [viewItem, setViewItem] = useState<Subscription | null>(null)
  const [editItem, setEditItem] = useState<Subscription | null>(null)

  const typeLabelMap: Record<$Enums.SubscriptionType, string> = {
    SOFTWARE_RENTAL: 'Yazılım Kiralama',
    CUSTOM_PROJECT: 'Özel Proje',
    MAINTENANCE: 'Bakım Anlaşması',
    NEXT_GEN_COACHING: 'Next Gen Coaching',
    AIDAT_TAKIP: 'Aidat Takip',
    FOOTBALL_CMS: 'Football Cms',
    DOMAIN: 'Domain',
    HOSTING: 'Hosting',
  }
  const periodLabelMap: Record<'MONTHLY'|'YEARLY', string> = {
    MONTHLY: 'Aylık',
    YEARLY: 'Yıllık',
  }
  const statusLabelMap: Record<'ACTIVE'|'EXPIRED'|'CANCELED', string> = {
    ACTIVE: 'Aktif',
    EXPIRED: 'Süresi Dolmuş',
    CANCELED: 'İptal',
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ all: "true" })
      const res = await fetch(`/api/subscriptions?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
    } catch {
      toast.error("Abonelikler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refresh = () => {
    fetchData()
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR")

    return items.filter((item) => {
      const itemTypes = Array.isArray(item.type)
        ? item.type.map(String)
        : [String(item.type)]
      const searchableText = [
        item.name,
        item.customer?.fullName,
        item.customerId,
        item.price,
        itemTypes.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")

      return (
        (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
        (type === "ALL" || itemTypes.includes(type)) &&
        (period === "ALL" || item.period === period) &&
        (status === "ALL" || item.status === status)
      )
    })
  }, [items, period, search, status, type])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)
  const firstItem = filteredItems.length === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, filteredItems.length)

  const stats = {
    total: items.length,
    active: items.filter(i => i.status === 'ACTIVE').length,
    expired: items.filter(i => i.status === 'EXPIRED').length,
    totalValue: items.reduce((sum, i) => sum + (parseInt(String(i.price)) || 0), 0),
  }
  const hasActiveFilters = search.trim() !== "" || type !== "ALL" || period !== "ALL" || status !== "ALL"

  useEffect(() => {
    setPage(1)
  }, [pageSize, period, search, status, type])

  const clearFilters = () => {
    setSearch("")
    setType("ALL")
    setPeriod("ALL")
    setStatus("ALL")
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-lg py-0">
        <CardContent className="grid gap-0 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Toplam", value: stats.total, helper: "abonelik", icon: Repeat },
            { label: "Aktif", value: stats.active, helper: "devam eden", icon: Calendar },
            { label: "Süresi Dolmuş", value: stats.expired, helper: "yenileme bekleyen", icon: Calendar },
            { label: "Toplam Değer", value: stats.totalValue.toLocaleString("tr-TR"), helper: "TL", icon: DollarSign },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={cn(
                  "flex min-h-16 items-center justify-between gap-3 border-b px-4 py-2.5 xl:border-b-0 xl:border-r xl:last:border-r-0",
                  index >= 2 && "sm:border-b-0"
                )}
              >
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</div>
                  <div className="mt-0.5 text-lg font-semibold tracking-tight">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.helper}</div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted/30">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="rounded-lg py-0">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex h-9 shrink-0 items-center gap-2 px-1 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtrele
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_180px_150px_150px_130px_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Müşteri, ad veya tür ara"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9">
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Türler</SelectItem>
                <SelectItem value="SOFTWARE_RENTAL">Yazılım Kiralama</SelectItem>
                <SelectItem value="CUSTOM_PROJECT">Özel Proje</SelectItem>
                <SelectItem value="MAINTENANCE">Bakım Anlaşması</SelectItem>
                <SelectItem value="NEXT_GEN_COACHING">Next Gen Coaching</SelectItem>
                <SelectItem value="AIDAT_TAKIP">Aidat Takip</SelectItem>
                <SelectItem value="FOOTBALL_CMS">Football Cms</SelectItem>
                <SelectItem value="DOMAIN">Domain</SelectItem>
                <SelectItem value="HOSTING">Hosting</SelectItem>
              </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9">
                <SelectValue placeholder="Periyot seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Periyotlar</SelectItem>
                <SelectItem value="MONTHLY">Aylık</SelectItem>
                <SelectItem value="YEARLY">Yıllık</SelectItem>
              </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="EXPIRED">Süresi Dolmuş</SelectItem>
                <SelectItem value="CANCELED">İptal</SelectItem>
              </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sayfa" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} / sayfa
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="h-9">
                  Temizle
                </Button>
              )}
              <Button variant="outline" onClick={fetchData} className="h-9 px-3" aria-label="Yenile">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="gap-0 rounded-lg py-0">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Abonelikler</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {filteredItems.length === 0 ? "Kayıt yok" : `${firstItem}-${lastItem} / ${filteredItems.length} kayıt`}
                {filteredItems.length !== items.length ? `, toplam ${items.length} abonelik` : ""}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Repeat}
                title="Abonelik bulunamadı"
                description="Arama kriterlerinize uygun abonelik bulunmuyor veya henüz abonelik eklenmemiş."
                action={
                  <Button onClick={onAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Abonelik Ekle
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Müşteri
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Abonelik</TableHead>
                      <TableHead className="font-semibold">Periyot</TableHead>
                      <TableHead className="font-semibold">Bitiş</TableHead>
                      <TableHead className="font-semibold">Durum</TableHead>
                      <TableHead className="font-semibold text-right">Tutar</TableHead>
                      <TableHead className="font-semibold text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link href={routes.customers.detail(s.customerId)} className="text-primary hover:underline font-medium">
                            {s.customer?.fullName || s.customerId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-48">
                            <div className="font-medium">{s.name}</div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(Array.isArray(s.type) ? s.type : [s.type]).map((itemType) => (
                                <Badge key={String(itemType)} variant="outline" className="text-xs font-normal">
                                  {typeLabelMap[itemType as $Enums.SubscriptionType] || String(itemType)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{periodLabelMap[s.period as 'MONTHLY'|'YEARLY'] || s.period}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(s.endDate).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {s.price} TL
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewItem(s)} className="h-8 w-8" aria-label="Abonelik detayını görüntüle">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditItem(s)} className="h-8 w-8" aria-label="Abonelik düzenle">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={async () => {
                                if (!confirm('Kaydı silmek istediğinizden emin misiniz?')) return
                                try {
                                  const res = await fetch(`/api/subscriptions?id=${s.id}`, { method: 'DELETE' })
                                  if (!res.ok) throw new Error('Silme başarısız')
                                  toast.success('Abonelik silindi')
                                  refresh()
                                } catch {
                                  toast.error('Abonelik silinemedi')
                                }
                              }}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label="Abonelik sil"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <span>
                  Sayfa {page} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Önceki
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages || loading}>
                    Sonraki
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonelik Detayı</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">ID:</span> {viewItem.id}</div>
              <div><span className="text-gray-600">Müşteri:</span> {viewItem.customerId}</div>
              <div><span className="text-gray-600">Ad:</span> {viewItem.name}</div>
              <div><span className="text-gray-600">Tür:</span> {Array.isArray(viewItem.type) ? viewItem.type.join(', ') : (viewItem.type as unknown as string)}</div>
              <div><span className="text-gray-600">Periyot:</span> {viewItem.period}</div>
              <div><span className="text-gray-600">Başlangıç:</span> {new Date(viewItem.startDate).toLocaleDateString('tr-TR')}</div>
              <div><span className="text-gray-600">Bitiş:</span> {new Date(viewItem.endDate).toLocaleDateString('tr-TR')}</div>
              <div><span className="text-gray-600">Oto Yenileme:</span> {viewItem.autoRenew ? 'Evet' : 'Hayır'}</div>
              <div><span className="text-gray-600">Durum:</span> {statusLabelMap[viewItem.status as 'ACTIVE'|'EXPIRED'|'CANCELED'] || viewItem.status}</div>
              <div><span className="text-gray-600">Tutar (TL):</span> {viewItem.price}</div>
              <div><span className="text-gray-600">Oluşturulma:</span> {new Date(viewItem.createdAt).toLocaleDateString('tr-TR')}</div>
              <div><span className="text-gray-600">Güncellenme:</span> {new Date(viewItem.updatedAt).toLocaleDateString('tr-TR')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Abonelik Düzenle</DialogTitle>
          </DialogHeader>
          {editItem && (
            <SubscriptionForm
              embedded
              initial={{
                customerId: editItem.customerId,
                name: editItem.name,
                types: Array.isArray(editItem.type) ? (editItem.type as $Enums.SubscriptionType[]) : [editItem.type as unknown as $Enums.SubscriptionType],
                period: editItem.period as 'MONTHLY' | 'YEARLY',
                startDate: new Date(editItem.startDate).toISOString().slice(0,10),
                endDate: new Date(editItem.endDate).toISOString().slice(0,10),
                autoRenew: editItem.autoRenew ?? false,
                status: editItem.status as 'ACTIVE' | 'EXPIRED' | 'CANCELED',
                price: editItem.price || '',
              }}
              onCancel={() => setEditItem(null)}
              onSuccess={() => { setEditItem(null); refresh(); }}
              onSubmit={async (data) => {
                const payload = { ...data, id: editItem.id }
                const res = await fetch(`/api/subscriptions`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error('Güncelleme başarısız')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
