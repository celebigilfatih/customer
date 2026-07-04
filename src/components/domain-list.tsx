"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Domain } from "@/generated/prisma"
import { routes } from "@/lib/routes"
import { AlertTriangle, ChevronLeft, ChevronRight, Filter, Pencil, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  onAdd?: () => void
}

type SimpleCustomer = { id: string; fullName: string; club?: string | null }
type CustomersResponse = { data?: SimpleCustomer[] }
type DomainListItem = Domain & {
  customer?: SimpleCustomer | null
}

const ALL_CUSTOMERS_VALUE = "__all_customers"
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function DomainList({ onAdd }: Props) {
  const [items, setItems] = useState<DomainListItem[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [customerId, setCustomerId] = useState(ALL_CUSTOMERS_VALUE)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.set("search", search.trim())
      if (customerId !== ALL_CUSTOMERS_VALUE) params.set("customerId", customerId)
      const res = await fetch(`/api/domains?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Domainler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [customerId, limit, page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers?limit=100`)
        if (!res.ok) return
        const data = await res.json() as CustomersResponse
        const items = (data.data || []).map((c) => ({ id: c.id, fullName: c.fullName, club: c.club }))
        setCustomers(items)
      } catch {}
    }
    loadCustomers()
  }, [])

  const hasActiveFilters = search.trim() !== "" || customerId !== ALL_CUSTOMERS_VALUE

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const updateCustomer = (value: string) => {
    setCustomerId(value)
    setPage(1)
  }

  const updateLimit = (value: string) => {
    setLimit(Number(value))
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setCustomerId(ALL_CUSTOMERS_VALUE)
    setPage(1)
  }

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (domain: Domain) => {
    setDeletingDomain(domain)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingDomain) return
    try {
      const res = await fetch(`/api/domains/${deletingDomain.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Silme başarısız")
      toast.success("Domain silindi")
      setDeleteConfirmOpen(false)
      setDeletingDomain(null)
      fetchData()
    } catch {
      toast.error("Domain silinemedi")
    }
  }

  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1
  const lastItem = Math.min(page * limit, total)

  return (
    <div className="space-y-3">
      <Card className="rounded-lg py-0">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex h-9 shrink-0 items-center gap-2 px-1 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtrele
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_220px_130px_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Domain ara"
                  className="h-9 pl-9"
                />
              </div>
              <Select value={customerId} onValueChange={updateCustomer}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Müşteri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CUSTOMERS_VALUE}>Tüm müşteriler</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.club || customer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={updateLimit}>
                <SelectTrigger className="h-9 w-full">
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

      <Card className="gap-0 rounded-lg py-0">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Domainler</CardTitle>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {total === 0 ? "Kayıt yok" : `${firstItem}-${lastItem} / ${total} kayıt`}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Domain</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Kayıt</TableHead>
              <TableHead>Yenileme</TableHead>
              <TableHead className="w-[96px] text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Domainler yükleniyor...
                </TableCell>
              </TableRow>
            )}
            {!loading && items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  {d.customer ? (
                    <Link
                      href={routes.customers.detail(d.customer.id)}
                      className="block rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block font-medium">{d.customer.club || d.customer.fullName}</span>
                      {d.customer.club ? (
                        <span className="block text-xs text-muted-foreground">{d.customer.fullName}</span>
                      ) : null}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Müşteri yok</span>
                  )}
                </TableCell>
                <TableCell>{d.registerDate ? new Date(d.registerDate).toLocaleDateString("tr-TR") : '-'}</TableCell>
                <TableCell>{new Date(d.renewDate).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(d)} className="h-8 w-8" aria-label="Domain düzenle">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(d)} className="h-8 w-8" aria-label="Domain sil">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                  <div className="flex flex-col items-center gap-3">
                    <span>Kayıt bulunamadı</span>
                    {onAdd ? (
                      <Button variant="outline" size="sm" onClick={onAdd}>
                        Yeni Domain
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )}
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Domain Düzenle</DialogTitle>
          </DialogHeader>
          {editingDomain && <DomainEditForm domain={editingDomain} customers={customers} onSuccess={() => { setEditDialogOpen(false); fetchData() }} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Domain Sil
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deletingDomain?.name}</strong> domain&apos;ini silmek istediğinize emin misiniz?
            Bu işlem geri alınamaz.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete}>Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DomainEditForm({ domain, customers, onSuccess }: { domain: Domain; customers: SimpleCustomer[]; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerId: domain.customerId,
    name: domain.name,
    registerDate: domain.registerDate ? new Date(domain.registerDate).toISOString().split('T')[0] : '',
    renewDate: domain.renewDate ? new Date(domain.renewDate).toISOString().split('T')[0] : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`/api/domains/${domain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Güncelleme başarısız")
      toast.success("Domain güncellendi")
      onSuccess()
    } catch {
      toast.error("Domain güncellenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Müşteri</label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Müşteri seçin</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.club || c.fullName}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Domain</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="example.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kayıt Tarihi</label>
        <input
          value={formData.registerDate}
          onChange={(e) => setFormData({ ...formData, registerDate: e.target.value })}
          placeholder="YYYY-MM-DD"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Yenileme Tarihi</label>
        <input
          value={formData.renewDate}
          onChange={(e) => setFormData({ ...formData, renewDate: e.target.value })}
          placeholder="YYYY-MM-DD"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>İptal</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Kaydediliyor..." : "Güncelle"}</Button>
      </DialogFooter>
    </form>
  )
}
