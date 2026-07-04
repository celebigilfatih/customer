"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Edit,
  FileText,
  Globe,
  Package,
  Receipt,
  RotateCcw,
  Server,
  ShoppingCart,
  Truck,
  User,
  Wallet,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { routes } from "@/lib/routes"

type SaleStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "CANCELLED"

type Sale = {
  id: string
  number: string
  status: SaleStatus
  subtotal: string
  taxAmount: string
  total: string
  paidAmount: string
  remainingAmount: string
  issueDate: string
  dueDate: string
  notes?: string | null
  canCancel: boolean
  hasPaidSupplierPurchase: boolean
  customer: {
    id: string
    fullName: string
    club: string
    phoneNumber?: string | null
  }
  itemLabels: string[]
  items: Array<{
    id: string
    description: string
    quantity: string
    unitPrice: string
    totalPrice: string
    domain?: {
      id: string
      name: string
      registerDate: string
      renewDate: string
      autoRenew: boolean
      whoisNote?: string | null
    } | null
    hosting?: { id: string; name: string; endDate: string; notes?: string | null } | null
    supplierPurchase?: SupplierPurchase | null
  }>
  payments: Array<{
    id: string
    amount: string
    status: string
    paidDate?: string | null
    note?: string | null
  }>
  stockMovements: Array<{
    id: string
    type: string
    quantity: string
    description?: string | null
    product?: { name: string } | null
  }>
  supplierPurchases: SupplierPurchase[]
  accountTransactions: Array<{
    id: string
    type: string
    debit: string
    credit: string
    balance: string
    description?: string | null
  }>
}

type SupplierPurchase = {
  id: string
  description: string
  total: string
  status: string
  supplierInvoiceNo?: string | null
  supplier?: { id: string; name: string } | null
  payments: Array<{ id: string; amount: string }>
}

const statusLabels: Record<SaleStatus, string> = {
  DRAFT: "Taslak",
  ISSUED: "Açık",
  PARTIAL: "Kısmi",
  PAID: "Ödendi",
  CANCELLED: "İptal",
}

const statusClasses: Record<SaleStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ISSUED: "bg-blue-50 text-blue-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
}

const paymentStatusLabels: Record<string, string> = {
  DUE: "Bekliyor",
  LATE: "Gecikmiş",
  PAID: "Ödendi",
  CANCELLED: "İptal",
}

const transactionTypeLabels: Record<string, string> = {
  INVOICE_DEBT: "Fatura Borcu",
  PAYMENT_CREDIT: "Tahsilat",
  INVOICE_CANCELLATION_CREDIT: "Fatura İptali",
  PAYMENT_CANCELLATION_DEBIT: "Tahsilat İptali",
  MANUAL_ADJUSTMENT: "Düzeltme",
  OPENING_BALANCE: "Açılış",
}

function formatMoney(value: string | number) {
  const number = Number(value)
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0)
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatNumber(value: string | number) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString("tr-TR") : "-"
}

function uniquePurchases(sale: Sale) {
  const all = [
    ...sale.supplierPurchases,
    ...sale.items.flatMap((item) => (item.supplierPurchase ? [item.supplierPurchase] : [])),
  ]
  return Array.from(new Map(all.map((purchase) => [purchase.id, purchase])).values())
}

function getOperationLabel(item: Sale["items"][number]) {
  if (item.domain) return `Domain: ${item.domain.name}`
  if (item.hosting) return `Hosting: ${item.hosting.name}`
  return "-"
}

function getPurchaseStatusLabel(status: string) {
  if (status === "CANCELLED") return "İptal"
  if (status === "PAID") return "Ödendi"
  return "Borçlu"
}

function EmptyState({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
      <Icon className="h-5 w-5" />
      <p>{title}</p>
    </div>
  )
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "warning"
}) {
  return (
    <div className="min-w-0 border-t p-4 sm:border-l sm:border-t-0 first:sm:border-l-0">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p
        className={
          tone === "success"
            ? "mt-1 truncate text-lg font-semibold text-emerald-700"
            : tone === "warning"
              ? "mt-1 truncate text-lg font-semibold text-amber-700"
              : "mt-1 truncate text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}

export default function AdminSaleDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSale = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/sales/${params.id}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Satış detayı alınamadı")
        setSale(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Satış detayı alınamadı")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) loadSale()
  }, [params.id])

  const supplierPurchases = useMemo(() => (sale ? uniquePurchases(sale) : []), [sale])
  const domainItems = useMemo(() => sale?.items.filter((item) => item.domain) || [], [sale])
  const hostingItems = useMemo(() => sale?.items.filter((item) => item.hosting) || [], [sale])
  const canCancel = Boolean(sale?.canCancel && !sale.hasPaidSupplierPurchase)
  const customerName = sale ? sale.customer.club || sale.customer.fullName : "Müşteri"

  const cancelSale = async () => {
    if (!sale) return
    setCanceling(true)
    setError(null)
    try {
      const response = await fetch(`/api/sales/${sale.id}/cancel`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Satış iptal edilemedi")
      setSale(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satış iptal edilemedi")
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        className="gap-3"
        title={sale ? sale.number : "Satış Detayı"}
        description={sale ? `${customerName} satış kaydı` : "Satış kaydı yükleniyor"}
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Satışlar", href: routes.admin.sales },
          { label: sale?.number || "Detay" },
        ]}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.push(routes.admin.sales)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
            {sale && sale.status !== "CANCELLED" && (
              <Button asChild variant="outline">
                <Link href={`/admin/sales/${sale.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Link>
              </Button>
            )}
            {sale && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!canCancel || canceling}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Satışı İptal Et
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Satış iptal edilsin mi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Fatura, tahsilat, cari ve stok kayıtları silinmez; ters kayıtlarla
                      dengelenir. Bu işlem audit izi bırakır.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction onClick={cancelSale}>İptal Et</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sale?.hasPaidSupplierPurchase && sale.status !== "CANCELLED" && (
        <Alert className="py-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tedarikçi ödemesi yapıldığı için bu satış otomatik iptal edilemez.
          </AlertDescription>
        </Alert>
      )}

      {loading || !sale ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Satış yükleniyor</CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusClasses[sale.status]} variant="secondary">
                      {statusLabels[sale.status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(sale.issueDate)} oluşturuldu
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-normal">{sale.number}</h2>
                    <Link
                      className="mt-1 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                      href={`/admin/customers/${sale.customer.id}`}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {customerName}
                    </Link>
                    {sale.customer.club && sale.customer.fullName !== sale.customer.club && (
                      <p className="mt-1 text-sm text-muted-foreground">{sale.customer.fullName}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 border-t bg-muted/20 p-4 text-sm lg:border-l lg:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Vade
                    </span>
                    <span className="font-medium">{formatDate(sale.dueDate)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Not
                    </span>
                    <span className="max-w-[220px] text-right">{sale.notes || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                      Kalem
                    </span>
                    <span className="font-medium">{sale.items.length}</span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-5">
                <MetricCell label="KDV Hariç" value={formatMoney(sale.subtotal)} />
                <MetricCell label="KDV" value={formatMoney(sale.taxAmount)} />
                <MetricCell label="Toplam" value={formatMoney(sale.total)} />
                <MetricCell label="Tahsilat" value={formatMoney(sale.paidAmount)} tone="success" />
                <MetricCell label="Kalan" value={formatMoney(sale.remainingAmount)} tone="warning" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="items" className="space-y-3">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-5 lg:w-[760px]">
              <TabsTrigger value="items">Kalemler</TabsTrigger>
              <TabsTrigger value="payments">Tahsilatlar</TabsTrigger>
              <TabsTrigger value="ledger">Cari & Stok</TabsTrigger>
              <TabsTrigger value="suppliers">Tedarikçi</TabsTrigger>
              <TabsTrigger value="operations">Operasyon</TabsTrigger>
            </TabsList>

            <TabsContent value="items">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-4 w-4" />
                    Satış Kalemleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Operasyon</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Birim Fiyat</TableHead>
                          <TableHead className="text-right">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-muted-foreground">{getOperationLabel(item)}</TableCell>
                            <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                            <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMoney(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    Tahsilatlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {sale.payments.length === 0 ? (
                    <EmptyState icon={CreditCard} title="Tahsilat yok" />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Açıklama</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sale.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.paidDate)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMoney(payment.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {paymentStatusLabels[payment.status] || payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {payment.note || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ledger">
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4" />
                      Cari Hareket Etkisi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tür</TableHead>
                            <TableHead className="text-right">Borç</TableHead>
                            <TableHead className="text-right">Alacak</TableHead>
                            <TableHead className="text-right">Bakiye</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sale.accountTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <EmptyState icon={Wallet} title="Cari hareket yok" />
                              </TableCell>
                            </TableRow>
                          ) : (
                            sale.accountTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {transactionTypeLabels[transaction.type] || transaction.type}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {transaction.description || "-"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatMoney(transaction.debit)}</TableCell>
                                <TableCell className="text-right">
                                  {formatMoney(transaction.credit)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatMoney(transaction.balance)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Stok Hareketleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sale.stockMovements.length === 0 ? (
                      <EmptyState icon={Package} title="Stok hareketi yok" />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ürün</TableHead>
                              <TableHead>Tür</TableHead>
                              <TableHead className="text-right">Miktar</TableHead>
                              <TableHead>Açıklama</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sale.stockMovements.map((movement) => (
                              <TableRow key={movement.id}>
                                <TableCell>{movement.product?.name || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {movement.type === "IN"
                                      ? "Giriş"
                                      : movement.type === "OUT"
                                        ? "Çıkış"
                                        : movement.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(movement.quantity)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {movement.description || "-"}
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
            </TabsContent>

            <TabsContent value="suppliers">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4" />
                    Tedarikçi Alışları
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {supplierPurchases.length === 0 ? (
                    <EmptyState icon={Truck} title="Alış kaydı yok" />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Fatura/Not</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supplierPurchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                              <TableCell>{purchase.supplier?.name || "-"}</TableCell>
                              <TableCell className="font-medium">{purchase.description}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {purchase.supplierInvoiceNo || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMoney(purchase.total)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getPurchaseStatusLabel(purchase.status)}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations">
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4" />
                      Domain Kayıtları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {domainItems.length === 0 ? (
                      <EmptyState icon={Globe} title="Domain operasyon kaydı yok" />
                    ) : (
                      <div className="divide-y">
                        {domainItems.map((item) => (
                          <div key={item.id} className="grid gap-2 p-4 text-sm sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Domain</p>
                              <p className="mt-1 font-medium">{item.domain?.name}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Kayıt</p>
                              <p className="mt-1">{formatDate(item.domain?.registerDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Yenileme</p>
                              <p className="mt-1">{formatDate(item.domain?.renewDate)}</p>
                            </div>
                            <div className="sm:col-span-3">
                              <p className="text-xs uppercase text-muted-foreground">Not</p>
                              <p className="mt-1 text-muted-foreground">
                                {item.domain?.whoisNote || "-"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="h-4 w-4" />
                      Hosting Kayıtları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {hostingItems.length === 0 ? (
                      <EmptyState icon={Server} title="Hosting operasyon kaydı yok" />
                    ) : (
                      <div className="divide-y">
                        {hostingItems.map((item) => (
                          <div key={item.id} className="grid gap-2 p-4 text-sm sm:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Hosting</p>
                              <p className="mt-1 font-medium">{item.hosting?.name}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Bitiş</p>
                              <p className="mt-1">{formatDate(item.hosting?.endDate)}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs uppercase text-muted-foreground">Not</p>
                              <p className="mt-1 text-muted-foreground">
                                {item.hosting?.notes || "-"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
