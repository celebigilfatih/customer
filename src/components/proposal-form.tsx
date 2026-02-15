"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { proposalCreateSchema, type ProposalCreate, type ProposalItem as ProposalItemType } from "@/lib/validations"
import { toast } from "sonner"
import { getProposalTypes } from "@/lib/settings-client"
import { Plus, Trash2, Package, User, FileText, DollarSign, Calendar } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SimpleCustomer = { id: string; fullName: string }
type Product = { id: string; name: string; description: string | null; unitPrice: string | number; group?: { name: string } | null }

interface ProposalFormProps {
  onSubmit?: (data: ProposalCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
  initial?: Partial<ProposalCreate>
}

export function ProposalForm({ onSubmit, onSuccess, onCancel, embedded = false, initial }: ProposalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [proposalTypes, setProposalTypes] = useState<{ id: string; name: string; label: string; isActive: boolean }[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(proposalCreateSchema),
    defaultValues: {
      customerId: "",
      title: "",
      type: undefined,
      description: "",
      amount: "",
      currency: "TRY",
      validUntil: "",
      notes: "",
      items: [],
      ...(initial || {}),
    } as ProposalCreate,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    const loadProposalTypes = async () => {
      try {
        const types = await getProposalTypes()
        setProposalTypes(types.filter(t => t.isActive))
      } catch (error) {
        console.error("Failed to load proposal types:", error)
        // Fallback to default types
        setProposalTypes([
          { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
          { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
          { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
          { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
        ])
      } finally {
        setTypesLoading(false)
      }
    }

    loadProposalTypes()
  }, [])

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers?limit=100`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.data || []).map((c: { id: string; fullName: string }) => ({ id: c.id, fullName: c.fullName }))
        setCustomers(items)
      } catch {}
    }
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?limit=100`)
        if (!res.ok) return
        const data = await res.json()
        // API returns array directly or {data: array}
        setProducts(Array.isArray(data) ? data : (data.data || []))
      } catch {}
      finally {
        setProductsLoading(false)
      }
    }
    loadCustomers()
    loadProducts()
  }, [])

  useEffect(() => {
    const toYmd = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    if (!form.getValues('validUntil')) form.setValue('validUntil', toYmd(nextMonth))
  }, [form])

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    const unitPrice = typeof product.unitPrice === 'string' ? product.unitPrice : String(product.unitPrice)
    append({
      productId: product.id,
      description: product.description || product.name,
      quantity: "1",
      unitPrice: unitPrice,
      totalPrice: unitPrice,
    })
    calculateTotal()
  }

  const handleQuantityChange = (index: number, quantity: string) => {
    const items = form.getValues('items') || []
    const item = items[index]
    if (item) {
      const qty = parseInt(quantity) || 1
      const unitPrice = parseFloat(item.unitPrice) || 0
      const total = qty * unitPrice
      form.setValue(`items.${index}.quantity`, String(qty))
      form.setValue(`items.${index}.totalPrice`, String(total))
      calculateTotal()
    }
  }

  const handleUnitPriceChange = (index: number, price: string) => {
    const items = form.getValues('items') || []
    const item = items[index]
    if (item) {
      const unitPrice = parseFloat(price) || 0
      const qty = parseInt(item.quantity) || 1
      const total = qty * unitPrice
      form.setValue(`items.${index}.unitPrice`, String(unitPrice))
      form.setValue(`items.${index}.totalPrice`, String(total))
      calculateTotal()
    }
  }

  const calculateTotal = () => {
    const items = form.getValues('items') || []
    const total = items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
    form.setValue('amount', String(Math.round(total)))
  }

  const handleSubmit = async (data: ProposalCreate) => {
    setIsLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        const response = await fetch(`/api/proposals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
      }
      toast.success("Teklif başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error("Teklif kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalid = (errors: Record<string, unknown>) => {
    const keys = Object.keys(errors || {})
    if (keys.length > 0) {
      const labelMap: Record<string, string> = {
        customerId: 'Müşteri',
        title: 'Başlık',
        type: 'Tür',
        amount: 'Tutar',
        validUntil: 'Geçerlilik',
      }
      const fields = keys.map(k => labelMap[k] || k).join(', ')
      toast.error(`Lütfen doldurun: ${fields}`)
    } else {
      toast.error("Lütfen zorunlu alanları kontrol edin")
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <FormField
                  control={form.control}
                  name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <SelectTrigger aria-required="true">
                        <SelectValue placeholder="Müşteri seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teklif Türü</FormLabel>
                    {typesLoading ? (
                      <div className="text-muted-foreground text-sm">Yükleniyor...</div>
                    ) : (
                      <Select
                        onValueChange={(v) => field.onChange(v as 'SUBSCRIPTION' | 'PROJECT' | 'MAINTENANCE' | 'RENEWAL')}
                        defaultValue={field.value}
                      >
                        <SelectTrigger aria-required="true">
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {proposalTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Web Sitesi Geliştirme Teklifi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Teklif detaylarını girin..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Products Section */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Teklif Kalemleri</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={handleAddProduct} disabled={productsLoading}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={productsLoading ? "Yükleniyor..." : "Ürün ekle..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.group?.name || "Genel"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Henüz ürün eklenmemiş</p>
                    <p className="text-sm">Yukarıdan stoktan ürün ekleyebilirsiniz</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Ürün</TableHead>
                          <TableHead className="font-semibold w-24">Miktar</TableHead>
                          <TableHead className="font-semibold w-32">Birim Fiyat</TableHead>
                          <TableHead className="font-semibold w-32">Toplam</TableHead>
                          <TableHead className="font-semibold w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Input
                                {...form.register(`items.${index}.description`)}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                className="h-8"
                                {...form.register(`items.${index}.quantity`)}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  className="h-8 pr-8"
                                  {...form.register(`items.${index}.unitPrice`)}
                                  onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">TL</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="h-8 pr-8 bg-muted"
                                  {...form.register(`items.${index}.totalPrice`)}
                                  readOnly
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">TL</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  remove(index)
                                  calculateTotal()
                                }}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toplam Tutar (TL)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Örn: 15000"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="pr-12 bg-muted font-semibold"
                          value={field.value || ''}
                          readOnly
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">TL</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geçerlilik Tarihi</FormLabel>
                    <FormControl>
                      <Input type="date" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ek notlar..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
