"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Task } from "@/generated/prisma"
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Circle, ClipboardList, Clock, Filter, Plus, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"

interface Props {
  onAdd?: () => void
}

type TaskListItem = Task & {
  customer?: {
    id: string
    club?: string | null
    fullName: string
  } | null
}

type TaskSummary = {
  total: number
  open: number
  pending: number
  done: number
}

const ALL_STATUS_VALUE = "__all_status"

export function TaskList({ onAdd }: Props) {
  const [items, setItems] = useState<TaskListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<TaskSummary>({ total: 0, open: 0, pending: 0, done: 0 })
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL_STATUS_VALUE)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.set("search", search.trim())
      if (status !== ALL_STATUS_VALUE) params.set("status", status)
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      setSummary(data.summary || { total: 0, open: 0, pending: 0, done: 0 })
    } catch {
      toast.error("Görevler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [limit, page, search, status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = {
    total: summary.total,
    open: summary.open,
    pending: summary.pending,
    done: summary.done,
  }
  const hasActiveFilters = search.trim() !== "" || status !== ALL_STATUS_VALUE

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const updateStatus = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setStatus(ALL_STATUS_VALUE)
    setPage(1)
  }

  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1
  const lastItem = Math.min(page * limit, total)

  return (
    <div className="space-y-3">
      <Card className="rounded-lg py-0">
        <CardContent className="grid gap-0 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Toplam", value: stats.total, helper: "görev", icon: ClipboardList },
            { label: "Açık", value: stats.open, helper: "yeni", icon: Circle },
            { label: "Bekliyor", value: stats.pending, helper: "devam eden", icon: Clock },
            { label: "Tamamlandı", value: stats.done, helper: "kapanan", icon: CheckCircle2 },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={[
                  "flex min-h-16 items-center justify-between gap-3 border-b px-4 py-2.5 xl:border-b-0 xl:border-r xl:last:border-r-0",
                  index >= 2 ? "sm:border-b-0" : "",
                ].join(" ")}
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
            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Görev ara"
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              <Select value={status} onValueChange={updateStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>Tüm durumlar</SelectItem>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="PENDING">Bekliyor</SelectItem>
                  <SelectItem value="DONE">Tamamlandı</SelectItem>
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

      <Card className="gap-0 rounded-lg py-0">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Görev Listesi</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {total === 0 ? "Kayıt yok" : `${firstItem}-${lastItem} / ${total} kayıt`}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="Görev bulunamadı"
                description="Henüz görev eklenmemiş veya arama kriterlerinize uygun görev yok."
                action={
                  <Button onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Görev Ekle
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
                      <TableHead>Görev</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Atanan</TableHead>
                      <TableHead>Oluşturulma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="min-w-56">
                            <div className="font-medium">{task.title}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">{task.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{task.customer?.club || task.customer?.fullName || task.customerId}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          {task.assigneeId ? (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted/40 text-xs font-medium">
                                {task.assigneeId.charAt(0).toUpperCase()}
                              </div>
                              <span>{task.assigneeId}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(task.createdAt).toLocaleDateString("tr-TR")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <span>Sayfa {page} / {totalPages}</span>
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
    </div>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return <Badge variant="secondary" className="gap-1"><Circle className="h-3 w-3" /> Açık</Badge>
    case "PENDING":
      return <Badge variant="default" className="gap-1"><Clock className="h-3 w-3" /> Bekliyor</Badge>
    case "DONE":
      return <Badge variant="outline" className="gap-1 border-green-600 text-green-600"><CheckCircle2 className="h-3 w-3" /> Tamamlandı</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
