"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Domain } from "@/generated/prisma"
import { Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Props {
  onAdd?: () => void
}

type SimpleCustomer = { id: string; fullName: string; club?: string }

export function DomainList({ onAdd }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Domain[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await fetch(`/api/domains?${params.toString()}`)
      if (!res.ok) throw new Error("Veri alınamadı")
      const data = await res.json()
      setItems(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      toast.error("Domainler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers?limit=100`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.data || []).map((c: any) => ({ id: c.id, fullName: c.fullName, club: c.club }))
        setCustomers(items)
      } catch {}
    }
    loadCustomers()
  }, [])

  const handleSearch = () => {
    setPage(1)
    fetchData()
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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Kayıt</TableHead>
              <TableHead>Yenileme</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.registerDate ? new Date(d.registerDate).toLocaleDateString("tr-TR") : '-'}</TableCell>
                <TableCell>{new Date(d.renewDate).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(d)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-6">Kayıt bulunamadı</TableCell>
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
            <strong>{deletingDomain?.name}</strong> domain'ini silmek istediğinize emin misiniz?
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
