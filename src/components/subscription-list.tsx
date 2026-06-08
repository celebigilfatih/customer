"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Subscription, $Enums } from "@/generated/prisma"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubscriptionForm } from "@/components/subscription-form"
import { Eye, Pencil, Trash, Search, Plus, Repeat, Calendar, DollarSign, Filter, MoreHorizontal, User } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import Link from "next/link"
import { routes } from "@/lib/routes"

interface Props {
  onAdd?: () => void
}

type SubscriptionRow = Subscription & { customer?: { fullName: string } }

export function SubscriptionList({ onAdd }: Props) {
  const [items, setItems] = useState<SubscriptionRow[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<string | undefined>(undefined)
  const [period, setPeriod] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)
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
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/subscriptions?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Abonelikler yüklenemedi")
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

  const refresh = () => {
    setPage(1)
    fetchData()
  }

  // Calculate stats
  const stats = {
    total: items.length,
    active: items.filter(i => i.status === 'ACTIVE').length,
    expired: items.filter(i => i.status === 'EXPIRED').length,
    totalValue: items.reduce((sum, i) => sum + (parseInt(String(i.price)) || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Abonelik</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Repeat className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Sistemde kayıtlı</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Devam eden</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolmuş</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Yenileme bekleyen</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">TL cinsinden</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filtreler</CardTitle>
          </div>
          <CardDescription>Abonelikleri filtrelemek için kullanın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Ara..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>Ara</Button>
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOFTWARE_RENTAL">Yazılım Kiralama</SelectItem>
                <SelectItem value="CUSTOM_PROJECT">Özel Proje</SelectItem>
                <SelectItem value="MAINTENANCE">Bakım Anlaşması</SelectItem>
                <SelectItem value="NEXT_GEN_COACHING">Next Gen Coaching</SelectItem>
                <SelectItem value="AIDAT_TAKIP">Aidat Takip</SelectItem>
                <SelectItem value="FOOTBALL_CMS">Football Cms</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Periyot seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Aylık</SelectItem>
                <SelectItem value="YEARLY">Yıllık</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="EXPIRED">Süresi Dolmuş</SelectItem>
                <SelectItem value="CANCELED">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Abonelik Listesi</CardTitle>
              <CardDescription>Tüm abonelikleri görüntüleyin ve yönetin</CardDescription>
            </div>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Abonelik
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
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
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Müşteri
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Ad</TableHead>
                      <TableHead className="font-semibold">Tür</TableHead>
                      <TableHead className="font-semibold">Periyot</TableHead>
                      <TableHead className="font-semibold">Bitiş</TableHead>
                      <TableHead className="font-semibold">Durum</TableHead>
                      <TableHead className="font-semibold text-right">Tutar</TableHead>
                      <TableHead className="font-semibold text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link href={routes.customers.detail(s.customerId)} className="text-primary hover:underline font-medium">
                            {s.customer?.fullName || s.customerId}
                          </Link>
                        </TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {Array.isArray(s.type) ? s.type.map((t) => typeLabelMap[t] || t).join(', ') : (typeLabelMap[s.type as unknown as $Enums.SubscriptionType] || (s.type as unknown as string))}
                          </Badge>
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
                            <Button variant="ghost" size="icon" onClick={() => setViewItem(s)} className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditItem(s)} className="h-8 w-8">
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

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="text-sm text-muted-foreground">
                  Sayfa <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Önceki
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    Sonraki
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
