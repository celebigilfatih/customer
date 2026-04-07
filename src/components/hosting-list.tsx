"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Hosting } from "@/generated/prisma"
import { hostingCreateSchema, type HostingCreate } from "@/lib/validations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Props {
  onAdd?: () => void
}

type SimpleCustomer = { id: string; fullName: string; club?: string }

export function HostingList({ onAdd }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Hosting[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingHosting, setEditingHosting] = useState<Hosting | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingHosting, setDeletingHosting] = useState<Hosting | null>(null)

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

  const handleEdit = (hosting: Hosting) => {
    setEditingHosting(hosting)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (hosting: Hosting) => {
    setDeletingHosting(hosting)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingHosting) return
    try {
      const res = await fetch(`/api/hosting/${deletingHosting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Silme başarısız")
      toast.success("Hosting silindi")
      setDeleteConfirmOpen(false)
      setDeletingHosting(null)
      fetchData()
    } catch {
      toast.error("Hosting silinemedi")
    }
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
              <TableHead>Alan Adı</TableHead>
              <TableHead>Bitiş Tarihi</TableHead>
              <TableHead>Notlar</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{(h as any).name}</TableCell>
                <TableCell>{new Date(h.endDate).toLocaleDateString("tr-TR")}</TableCell>
                <TableCell>{(h as any).notes || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(h)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(h)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hosting Düzenle</DialogTitle>
          </DialogHeader>
          {editingHosting && <HostingEditForm hosting={editingHosting} customers={customers} onSuccess={() => { setEditDialogOpen(false); fetchData() }} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Hosting Sil
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{(deletingHosting as any)?.name}</strong> hosting'ini silmek istediğinize emin misiniz?
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

function HostingEditForm({ hosting, customers, onSuccess }: { hosting: Hosting; customers: SimpleCustomer[]; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(hostingCreateSchema),
    defaultValues: {
      customerId: hosting.customerId,
      name: (hosting as any).name || "",
      endDate: hosting.endDate ? new Date(hosting.endDate).toISOString().split('T')[0] : "",
      notes: (hosting as any).notes || "",
    },
  })

  const handleSubmit = async (data: HostingCreate) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/hosting/${hosting.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Güncelleme başarısız")
      toast.success("Hosting güncellendi")
      onSuccess()
    } catch {
      toast.error("Hosting güncellenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Müşteri</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.club || c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alan Adı</FormLabel>
              <FormControl>
                <Input placeholder="example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bitiş Tarihi</FormLabel>
              <FormControl>
                <Input placeholder="YYYY-MM-DD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Input placeholder="Opsiyonel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onSuccess()}>İptal</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Kaydediliyor..." : "Güncelle"}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
