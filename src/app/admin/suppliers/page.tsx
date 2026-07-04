"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, Search, Truck } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type Supplier = {
  id: string
  name: string
  email: string | null
  phone: string | null
  balance: string | number
  isActive: boolean
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value || 0))
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    taxNumber: "",
    address: "",
    notes: "",
  })

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const response = await fetch(`/api/suppliers?${params}`)
      if (!response.ok) throw new Error("Tedarikçiler alınamadı")
      setSuppliers((await response.json()) as Supplier[])
    } catch {
      toast.error("Tedarikçiler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const createSupplier = async () => {
    if (!form.name.trim()) {
      toast.error("Tedarikçi adı gereklidir")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Tedarikçi oluşturulamadı")

      toast.success("Tedarikçi oluşturuldu")
      setOpen(false)
      setForm({ name: "", email: "", phone: "", taxNumber: "", address: "", notes: "" })
      fetchSuppliers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tedarikçi oluşturulamadı")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tedarikçiler"
        description="Alış, tedarikçi borcu ve ödeme takibi"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Tedarikçi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Tedarikçi</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Ad</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vergi No</Label>
                  <Input
                    value={form.taxNumber}
                    onChange={(event) => setForm({ ...form, taxNumber: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Textarea
                    rows={2}
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Not</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createSupplier} disabled={saving}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tedarikçi ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Bakiye</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Tedarikçi yok
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {supplier.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {supplier.email || supplier.phone || "-"}
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(supplier.balance)}</TableCell>
                    <TableCell>{supplier.isActive ? "Aktif" : "Pasif"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/suppliers/${supplier.id}`)}>
                            Detay
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
