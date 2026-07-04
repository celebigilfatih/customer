"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Globe, Plus, Receipt, Save, Server, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import { routes } from "@/lib/routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

type PaymentMode = "CREDIT" | "PARTIAL" | "PAID"
type PaymentType = "CASH" | "TRANSFER" | "CREDIT_CARD"
type CatalogItemType = "PRODUCT" | "SERVICE"
type OperationType = "DOMAIN" | "HOSTING"
type SupplierPurchaseStatus = "DUE" | "PAID"

type CustomerOption = {
  id: string
  fullName: string
  club?: string | null
}

type ProductOption = {
  id: string
  code: string
  name: string
  type: CatalogItemType
  group?: {
    id: string
    name: string
  } | null
  description: string | null
  stockQuantity: string | number
  unitPrice: string | number
  currency: string
}

type SupplierOption = {
  id: string
  name: string
}

type SupplierPurchaseDraft = {
  enabled: boolean
  supplierId: string
  unitCost: string
  taxRate: string
  purchaseDate: string
  dueDate: string
  status: SupplierPurchaseStatus
  paymentType: PaymentType
  supplierInvoiceNo: string
  note: string
}

type OperationDraft =
  | {
      type: "DOMAIN"
      name: string
      registerDate: string
      renewDate: string
      autoRenew: boolean
      whoisNote: string
    }
  | {
      type: "HOSTING"
      name: string
      endDate: string
      notes: string
    }

type SaleLine = {
  id: string
  productId?: string
  type?: CatalogItemType
  operationType?: OperationType | null
  description: string
  quantity: string
  unitPrice: string
  stockQuantity?: string | number
  purchase: SupplierPurchaseDraft
  operation?: OperationDraft
}

type DirectSaleResponse = {
  invoice?: {
    id: string
    customerId: string
    number: string
  }
  error?: string
}

function newId() {
  return crypto.randomUUID()
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function nextYearYmd() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value)
}

function paymentModeLabel(mode: PaymentMode) {
  if (mode === "PAID") return "Peşin"
  if (mode === "PARTIAL") return "Kısmi"
  return "Veresiye"
}

function normalizeText(value: string | null | undefined) {
  return (value || "").toLocaleLowerCase("tr-TR")
}

function inferOperationType(product: ProductOption): OperationType | null {
  const groupName = normalizeText(product.group?.name)
  const productName = normalizeText(product.name)
  if (groupName.includes("domain") || productName.includes("domain")) return "DOMAIN"
  if (groupName.includes("hosting") || productName.includes("hosting")) return "HOSTING"
  return null
}

function createPurchaseDraft(): SupplierPurchaseDraft {
  return {
    enabled: false,
    supplierId: "",
    unitCost: "",
    taxRate: "20",
    purchaseDate: todayYmd(),
    dueDate: todayYmd(),
    status: "DUE",
    paymentType: "TRANSFER",
    supplierInvoiceNo: "",
    note: "",
  }
}

function createOperationDraft(type: OperationType, defaultName: string): OperationDraft {
  if (type === "DOMAIN") {
    return {
      type,
      name: defaultName,
      registerDate: todayYmd(),
      renewDate: nextYearYmd(),
      autoRenew: true,
      whoisNote: "",
    }
  }

  return {
    type,
    name: defaultName,
    endDate: nextYearYmd(),
    notes: "",
  }
}

export function DirectSaleForm() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [customerId, setCustomerId] = useState("")
  const [productSelectValue, setProductSelectValue] = useState("")
  const [lines, setLines] = useState<SaleLine[]>([])
  const [taxRate, setTaxRate] = useState("20")
  const [dueDate, setDueDate] = useState(todayYmd)
  const [notes, setNotes] = useState("")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CREDIT")
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH")
  const [paidAmount, setPaidAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState(newId)
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true)
      try {
        const [customersResponse, productsResponse, suppliersResponse] = await Promise.all([
          fetch("/api/customers?limit=100"),
          fetch("/api/products?isActive=true"),
          fetch("/api/suppliers?isActive=true"),
        ])

        if (customersResponse.ok) {
          const data = (await customersResponse.json()) as { data?: CustomerOption[] }
          setCustomers(data.data || [])
        }

        if (productsResponse.ok) {
          const data = (await productsResponse.json()) as ProductOption[]
          setProducts(Array.isArray(data) ? data : [])
        }

        if (suppliersResponse.ok) {
          const data = (await suppliersResponse.json()) as SupplierOption[]
          setSuppliers(Array.isArray(data) ? data : [])
        }
      } catch {
        toast.error("Satış seçenekleri yüklenemedi")
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice),
      0
    )
    const taxAmount = subtotal * (toNumber(taxRate) / 100)
    const total = subtotal + taxAmount
    const collected =
      paymentMode === "PAID" ? total : paymentMode === "PARTIAL" ? toNumber(paidAmount) : 0

    return {
      subtotal,
      taxAmount,
      total,
      collected,
      remaining: total - collected,
    }
  }, [lines, paidAmount, paymentMode, taxRate])

  const addProductLine = (productId: string) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return
    const operationType = inferOperationType(product)

    setLines((current) => [
      ...current,
      {
        id: newId(),
        productId: product.id,
        type: product.type,
        operationType,
        description: product.description || product.name,
        quantity: "1",
        unitPrice: String(product.unitPrice),
        stockQuantity: product.type === "PRODUCT" ? product.stockQuantity : undefined,
        purchase: createPurchaseDraft(),
        operation: operationType ? createOperationDraft(operationType, product.name) : undefined,
      },
    ])
    setProductSelectValue("")
  }

  const addServiceLine = () => {
    setLines((current) => [
      ...current,
      {
        id: newId(),
        type: "SERVICE",
        operationType: null,
        description: "Serbest hizmet kalemi",
        quantity: "1",
        unitPrice: "",
        purchase: createPurchaseDraft(),
      },
    ])
  }

  const updateLine = (id: string, patch: Partial<SaleLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line))
    )
  }

  const removeLine = (id: string) => {
    setLines((current) => current.filter((line) => line.id !== id))
  }

  const updatePurchase = (id: string, patch: Partial<SupplierPurchaseDraft>) => {
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, purchase: { ...line.purchase, ...patch } } : line
      )
    )
  }

  const updateOperation = (id: string, patch: Partial<OperationDraft>) => {
    setLines((current) =>
      current.map((line) =>
        line.id === id && line.operation
          ? { ...line, operation: { ...line.operation, ...patch } as OperationDraft }
          : line
      )
    )
  }

  const validateClient = () => {
    if (!customerId) return "Müşteri seçilmelidir"
    if (lines.length === 0) return "En az bir satış kalemi eklenmelidir"
    if (toNumber(taxRate) < 0 || toNumber(taxRate) > 100) return "KDV oranı geçerli olmalıdır"
    if (!dueDate) return "Vade tarihi seçilmelidir"

    for (const line of lines) {
      if (!line.description.trim()) return "Satış kalemi açıklaması boş olamaz"
      if (toNumber(line.quantity) <= 0) return "Satış kalemi miktarı pozitif olmalıdır"
      if (toNumber(line.unitPrice) <= 0) return "Satış kalemi birim fiyatı pozitif olmalıdır"

      if (line.operationType === "DOMAIN") {
        if (!line.operation || line.operation.type !== "DOMAIN") return "Domain operasyon bilgisi gereklidir"
        if (!line.operation.name.trim()) return "Domain adı girilmelidir"
        if (!line.operation.registerDate || !line.operation.renewDate) {
          return "Domain kayıt ve yenileme tarihleri girilmelidir"
        }
      }

      if (line.operationType === "HOSTING") {
        if (!line.operation || line.operation.type !== "HOSTING") return "Hosting operasyon bilgisi gereklidir"
        if (!line.operation.name.trim()) return "Hosting hizmet adı girilmelidir"
        if (!line.operation.endDate) return "Hosting bitiş tarihi girilmelidir"
      }

      if (line.purchase.enabled) {
        if (!line.purchase.supplierId) return "Alış bilgisi için tedarikçi seçilmelidir"
        if (toNumber(line.purchase.unitCost) <= 0) return "Alış tutarı pozitif olmalıdır"
        if (toNumber(line.purchase.taxRate) < 0 || toNumber(line.purchase.taxRate) > 100) {
          return "Alış KDV oranı geçerli olmalıdır"
        }
        if (!line.purchase.purchaseDate) return "Alış tarihi girilmelidir"
        if (line.purchase.status === "DUE" && !line.purchase.dueDate) {
          return "Tedarikçi borcu için vade tarihi girilmelidir"
        }
      }
    }

    if (paymentMode === "PARTIAL") {
      if (toNumber(paidAmount) <= 0) return "Kısmi tahsilat tutarı pozitif olmalıdır"
      if (toNumber(paidAmount) >= totals.total) return "Kısmi tahsilat toplamdan küçük olmalıdır"
    }

    return null
  }

  const submitSale = async () => {
    const validationError = validateClient()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/sales/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customerId,
          dueDate,
          taxRate: toNumber(taxRate),
          notes: notes || undefined,
          paymentMode,
          paymentType,
          paidAmount: paymentMode === "PARTIAL" ? toNumber(paidAmount) : undefined,
          paymentNote: paymentNote || undefined,
          items: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: toNumber(line.quantity),
            unitPrice: toNumber(line.unitPrice),
            purchase: line.purchase.enabled
              ? {
                  supplierId: line.purchase.supplierId,
                  unitCost: toNumber(line.purchase.unitCost),
                  taxRate: toNumber(line.purchase.taxRate),
                  purchaseDate: line.purchase.purchaseDate,
                  dueDate: line.purchase.status === "DUE" ? line.purchase.dueDate : undefined,
                  status: line.purchase.status,
                  paymentType: line.purchase.paymentType,
                  supplierInvoiceNo: line.purchase.supplierInvoiceNo || undefined,
                  note: line.purchase.note || undefined,
                }
              : undefined,
            operation: line.operation,
          })),
        }),
      })
      const data = (await response.json()) as DirectSaleResponse

      if (!response.ok) throw new Error(data.error || "Direkt satış oluşturulamadı")

      toast.success(`Satış tamamlandı${data.invoice?.number ? `: ${data.invoice.number}` : ""}`)
      setIdempotencyKey(newId())
      router.push(`${routes.customers.detail(data.invoice?.customerId || customerId)}?tab=transactions`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Direkt satış oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-4">
            <CardTitle className="text-base">Satış Bilgileri</CardTitle>
            <CardDescription>Müşteri, vade ve satış notunu tek yerden girin.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(0,1fr)_160px_120px]">
            <div className="space-y-1.5">
              <Label>Müşteri</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={loadingOptions ? "Yükleniyor..." : "Müşteri seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.club || customer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vade</Label>
              <Input className="h-9" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>KDV (%)</Label>
              <Input
                className="h-9"
                inputMode="decimal"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <Label>Not</Label>
              <Textarea
                className="min-h-16"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Satışa ait kısa not"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Satış Kalemleri</CardTitle>
                <CardDescription>{lines.length} kalem, {formatCurrency(totals.subtotal)} ara toplam</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={productSelectValue} onValueChange={addProductLine}>
                  <SelectTrigger className="h-9 w-full sm:w-[260px]">
                    <SelectValue placeholder={loadingOptions ? "Yükleniyor..." : "Katalog kalemi ekle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.type === "SERVICE" ? "Hizmet" : product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" className="h-9" onClick={addServiceLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Serbest Satır
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="w-28">Miktar</TableHead>
                    <TableHead className="w-36">Birim Fiyat</TableHead>
                    <TableHead className="w-36">Toplam</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Henüz satış kalemi yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => (
                      <Fragment key={line.id}>
                        <TableRow>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <Input
                                className="h-9"
                                value={line.description}
                                onChange={(event) => updateLine(line.id, { description: event.target.value })}
                              />
                              {line.stockQuantity !== undefined ? (
                                <Badge variant="outline">Stok: {String(line.stockQuantity)}</Badge>
                              ) : line.type === "SERVICE" ? (
                                <Badge variant="outline">Hizmet</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              className="h-9"
                              inputMode="decimal"
                              value={line.quantity}
                              onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              className="h-9"
                              inputMode="decimal"
                              value={line.unitPrice}
                              onChange={(event) => updateLine(line.id, { unitPrice: event.target.value })}
                            />
                          </TableCell>
                          <TableCell className="align-top pt-4 font-mono text-sm font-medium">
                            {formatCurrency(toNumber(line.quantity) * toNumber(line.unitPrice))}
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeLine(line.id)}
                              aria-label="Satış kalemini sil"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="grid gap-3 lg:grid-cols-2">
                              {line.operation?.type === "DOMAIN" ? (
                                <div className="space-y-3 rounded-md border bg-background p-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Globe className="h-4 w-4" />
                                    Domain Operasyon Kaydı
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Domain Adı</Label>
                                      <Input
                                        value={line.operation.name}
                                        onChange={(event) => updateOperation(line.id, { name: event.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Kayıt Tarihi</Label>
                                      <Input
                                        type="date"
                                        value={line.operation.registerDate}
                                        onChange={(event) =>
                                          updateOperation(line.id, { registerDate: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Yenileme Tarihi</Label>
                                      <Input
                                        type="date"
                                        value={line.operation.renewDate}
                                        onChange={(event) =>
                                          updateOperation(line.id, { renewDate: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={line.operation.autoRenew}
                                        onCheckedChange={(checked) =>
                                          updateOperation(line.id, { autoRenew: checked })
                                        }
                                      />
                                      <Label>Otomatik yenileme</Label>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Whois Notu</Label>
                                      <Input
                                        value={line.operation.whoisNote}
                                        onChange={(event) =>
                                          updateOperation(line.id, { whoisNote: event.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {line.operation?.type === "HOSTING" ? (
                                <div className="space-y-3 rounded-md border bg-background p-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Server className="h-4 w-4" />
                                    Hosting Operasyon Kaydı
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Hizmet Adı</Label>
                                      <Input
                                        value={line.operation.name}
                                        onChange={(event) => updateOperation(line.id, { name: event.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Bitiş Tarihi</Label>
                                      <Input
                                        type="date"
                                        value={line.operation.endDate}
                                        onChange={(event) =>
                                          updateOperation(line.id, { endDate: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Not</Label>
                                      <Input
                                        value={line.operation.notes}
                                        onChange={(event) => updateOperation(line.id, { notes: event.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              <div className="space-y-3 rounded-md border bg-background p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Truck className="h-4 w-4" />
                                    Satır Bazlı Alış
                                  </div>
                                  <Switch
                                    checked={line.purchase.enabled}
                                    onCheckedChange={(checked) => updatePurchase(line.id, { enabled: checked })}
                                  />
                                </div>
                                {line.purchase.enabled ? (
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Tedarikçi</Label>
                                      <Select
                                        value={line.purchase.supplierId}
                                        onValueChange={(value) => updatePurchase(line.id, { supplierId: value })}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Tedarikçi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                              {supplier.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Alış Birim Tutarı</Label>
                                      <Input
                                        inputMode="decimal"
                                        value={line.purchase.unitCost}
                                        onChange={(event) =>
                                          updatePurchase(line.id, { unitCost: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Alış KDV (%)</Label>
                                      <Input
                                        inputMode="decimal"
                                        value={line.purchase.taxRate}
                                        onChange={(event) =>
                                          updatePurchase(line.id, { taxRate: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Alış Tarihi</Label>
                                      <Input
                                        type="date"
                                        value={line.purchase.purchaseDate}
                                        onChange={(event) =>
                                          updatePurchase(line.id, { purchaseDate: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Tedarikçi Durumu</Label>
                                      <Select
                                        value={line.purchase.status}
                                        onValueChange={(value) =>
                                          updatePurchase(line.id, { status: value as SupplierPurchaseStatus })
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="DUE">Borçlu</SelectItem>
                                          <SelectItem value="PAID">Ödendi</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {line.purchase.status === "DUE" ? (
                                      <div className="space-y-2">
                                        <Label>Tedarikçi Vadesi</Label>
                                        <Input
                                          type="date"
                                          value={line.purchase.dueDate}
                                          onChange={(event) =>
                                            updatePurchase(line.id, { dueDate: event.target.value })
                                          }
                                        />
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Label>Ödeme Tipi</Label>
                                        <Select
                                          value={line.purchase.paymentType}
                                          onValueChange={(value) =>
                                            updatePurchase(line.id, { paymentType: value as PaymentType })
                                          }
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="CASH">Nakit</SelectItem>
                                            <SelectItem value="TRANSFER">Havale/EFT</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Label>Tedarikçi Fatura/No</Label>
                                      <Input
                                        value={line.purchase.supplierInvoiceNo}
                                        onChange={(event) =>
                                          updatePurchase(line.id, { supplierInvoiceNo: event.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Alış Notu</Label>
                                      <Input
                                        value={line.purchase.note}
                                        onChange={(event) => updatePurchase(line.id, { note: event.target.value })}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Talep üzerine alınan domain/hosting veya diğer hizmet maliyetini buradan bağlayın.
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-4 gap-0 rounded-lg py-0">
          <CardHeader className="border-b px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4" />
                Satış Özeti
              </CardTitle>
              <Badge variant="outline">{paymentModeLabel(paymentMode)}</Badge>
            </div>
            <CardDescription>Tahsilat ve toplamları kontrol edin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-sm">
            <div className="space-y-3 rounded-md border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                Tahsilat
              </div>
              <div className="space-y-1.5">
                <Label>Durum</Label>
                <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode)}>
                  <SelectTrigger className="h-9 w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">Veresiye</SelectItem>
                    <SelectItem value="PARTIAL">Kısmi Tahsilat</SelectItem>
                    <SelectItem value="PAID">Peşin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMode !== "CREDIT" ? (
                <div className="space-y-1.5">
                  <Label>Ödeme Tipi</Label>
                  <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                    <SelectTrigger className="h-9 w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Nakit</SelectItem>
                      <SelectItem value="TRANSFER">Havale/EFT</SelectItem>
                      <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {paymentMode === "PARTIAL" ? (
                <div className="space-y-1.5">
                  <Label>Tahsil Edilen</Label>
                  <Input
                    className="h-9 bg-background"
                    inputMode="decimal"
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                  />
                </div>
              ) : null}

              {paymentMode !== "CREDIT" ? (
                <div className="space-y-1.5">
                  <Label>Tahsilat Notu</Label>
                  <Input
                    className="h-9 bg-background"
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ara toplam</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">KDV</span>
              <span className="font-mono">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Genel toplam</span>
              <span className="font-mono">{formatCurrency(totals.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tahsilat</span>
              <span className="font-mono">{formatCurrency(Math.max(0, totals.collected))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kalan</span>
              <span className="font-mono">{formatCurrency(Math.max(0, totals.remaining))}</span>
            </div>
            </div>
            <Button className="mt-3 w-full" onClick={submitSale} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Kaydediliyor..." : "Satışı Tamamla"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
