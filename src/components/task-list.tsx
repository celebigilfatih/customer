"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Task } from "@/generated/prisma"
import { toast } from "sonner"
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  Circle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"

interface Props {
  onAdd?: () => void
}

export function TaskList({ onAdd }: Props) {
  const [items, setItems] = useState<Task[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Görevler yüklenemedi")
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

  // Calculate stats
  const stats = {
    total: items.length,
    open: items.filter(i => i.status === 'OPEN').length,
    pending: items.filter(i => i.status === 'PENDING').length,
    done: items.filter(i => i.status === 'DONE').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="secondary" className="flex items-center gap-1"><Circle className="h-3 w-3" /> Açık</Badge>
      case 'PENDING':
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Bekliyor</Badge>
      case 'DONE':
        return <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3" /> Tamamlandı</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Sistemde kayıtlı</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Circle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Yeni görevler</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekliyor</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Devam eden</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlandı</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
            <p className="text-xs text-muted-foreground">Biten görevler</p>
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
          <CardDescription>Görevleri filtrelemek için kullanın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Görev ara..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>Ara</Button>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Açık</SelectItem>
                <SelectItem value="PENDING">Bekliyor</SelectItem>
                <SelectItem value="DONE">Tamamlandı</SelectItem>
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
              <CardTitle className="text-lg">Görev Listesi</CardTitle>
              <CardDescription>Tüm görevleri ve talepleri görüntüleyin</CardDescription>
            </div>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev
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
              icon={ClipboardList}
              title="Görev bulunamadı"
              description="Henüz görev eklenmemiş veya arama kriterlerinize uygun görev yok."
              action={
                <Button onClick={onAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Görev Ekle
                </Button>
              }
            />
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Başlık</TableHead>
                      <TableHead className="font-semibold">Durum</TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Atanan
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Oluşturulma
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                        <TableCell>
                          {t.assigneeId ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {t.assigneeId.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm">{t.assigneeId}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString("tr-TR")}
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
    </div>
  )
}
