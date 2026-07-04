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
import { proposalCreateSchema, type ProposalCreate } from "@/lib/validations"
import { toast } from "sonner"
import { getProposalTypes } from "@/lib/settings-client"
import { FileText, Package, Save, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SimpleCustomer = { id: string; fullName: string; club?: string }
type CustomerResponse = { data?: SimpleCustomer[] }
type Product = {
  id: string
  name: string
  type: "PRODUCT" | "SERVICE"
  description: string | null
  unitPrice: string | number
  group?: { name: string } | null
}

function formatCurrency(value: string | number | undefined, currency = "TRY") {
  const amount = typeof value === "number" ? value : Number(value || 0)
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

interface ProposalFormProps {
  onSubmit?: (data: ProposalCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
  initial?: Partial<ProposalCreate>
}

export function ProposalForm({ onSubmit, onSuccess, onCancel, initial }: ProposalFormProps) {
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

  const watchedItems = form.watch("items") || []
  const watchedAmount = form.watch("amount")
  const watchedCurrency = form.watch("currency") || "TRY"
  const selectedCustomerId = form.watch("customerId")
  const selectedType = form.watch("type")
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
  const selectedProposalType = proposalTypes.find((type) => type.name === selectedType)

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
        const data = (await res.json()) as CustomerResponse
        const items = (data.data || []).map((customer) => ({
          id: customer.id,
          fullName: customer.fullName,
          club: customer.club,
        }))
        setCustomers(items)
      } catch {}
    }
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?isActive=true`)
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

  const handleRemoveItem = (index: number) => {
    const items = form.getValues('items') || []
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index)
    remove(index)
    const total = nextItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <Card className="gap-0 rounded-lg py-0">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Teklif Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <SelectTrigger className="h-9 w-full" aria-required="true">
                          <SelectValue placeholder="Müşteri seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.club || c.fullName}
                            </SelectItem>
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
                        <div className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">Yükleniyor...</div>
                      ) : (
                        <Select
                          onValueChange={(v) => field.onChange(v as 'SUBSCRIPTION' | 'PROJECT' | 'MAINTENANCE' | 'RENEWAL')}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="h-9 w-full" aria-required="true">
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
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geçerlilik</FormLabel>
                      <FormControl>
                        <Input className="h-9" type="date" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="Örn: Web Sitesi Geliştirme Teklifi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-14 resize-y" placeholder="Teklif detaylarını girin..." {...field} />
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
                        <Textarea className="min-h-14 resize-y" placeholder="Ek notlar..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg py-0">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Teklif Kalemleri
                  </CardTitle>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {fields.length} kalem, {formatCurrency(watchedAmount, watchedCurrency)} toplam
                  </div>
                </div>
                <Select onValueChange={handleAddProduct} disabled={productsLoading}>
                  <SelectTrigger className="h-9 w-full lg:w-[240px]">
                    <SelectValue placeholder={productsLoading ? "Yükleniyor..." : "Katalog kalemi ekle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.type === "SERVICE" ? "Hizmet" : product.group?.name || "Genel"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {fields.length === 0 ? (
                <div className="flex min-h-28 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 text-center text-muted-foreground">
                  <Package className="mb-2 h-7 w-7 opacity-60" />
                  <p className="text-sm font-medium text-foreground">Henüz kalem eklenmedi</p>
                  <p className="mt-1 text-sm">Sağ üstten satış kataloğu kalemi seçerek başlayın.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="min-w-[280px] font-semibold">Açıklama</TableHead>
                        <TableHead className="w-24 font-semibold">Miktar</TableHead>
                        <TableHead className="w-36 font-semibold">Birim Fiyat</TableHead>
                        <TableHead className="w-36 font-semibold">Toplam</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Input {...form.register(`items.${index}.description`)} className="h-8" />
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
                          <TableCell>
                            <div className="relative">
                              <Input
                                type="number"
                                className="h-8 bg-muted/50 pr-8 font-medium"
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
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Kalemi sil"
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
        </div>

        <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <Card className="gap-0 rounded-lg py-0">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-sm">Teklif Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Müşteri</span>
                  <span className="text-right font-medium">{selectedCustomer?.club || selectedCustomer?.fullName || "-"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Tür</span>
                  <span className="text-right font-medium">{selectedProposalType?.label || selectedType || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kalem</span>
                  <span className="font-medium">{watchedItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Para Birimi</span>
                  <span className="font-medium">{watchedCurrency}</span>
                </div>
              </div>

              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-xs font-medium uppercase text-muted-foreground">Toplam Tutar</div>
                <div className="mt-1 text-xl font-semibold tracking-tight">{formatCurrency(watchedAmount, watchedCurrency)}</div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isLoading} className="h-10 w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Kaydediliyor..." : "Teklifi Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="h-10 w-full">
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </Form>
  )
}
