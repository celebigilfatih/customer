"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Receipt, WalletCards } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SupplierPurchase = {
  id: string
  description: string
  total: string | number
  status: "DUE" | "PAID"
  purchaseDate: string
  dueDate: string | null
  supplierInvoiceNo: string | null
  invoice: { number: string; customerId: string } | null
}

type SupplierPayment = {
  id: string
  amount: string | number
  type: string
  paidDate: string
  note: string | null
}

type SupplierTransaction = {
  id: string
  type: "PURCHASE_DEBT" | "SUPPLIER_PAYMENT"
  debit: string | number
  credit: string | number
  balance: string | number
  description: string | null
  createdAt: string
}

type SupplierDetail = {
  id: string
  name: string
  email: string | null
  phone: string | null
  taxNumber: string | null
  address: string | null
  notes: string | null
  balance: string | number
  purchases: SupplierPurchase[]
  payments: SupplierPayment[]
  accountTransactions: SupplierTransaction[]
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number(value || 0))
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("tr-TR").format(new Date(value))
}

function transactionLabel(type: SupplierTransaction["type"]) {
  return type === "PURCHASE_DEBT" ? "Alış Borcu" : "Tedarikçi Ödemesi"
}

export default function SupplierDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentPurchase, setPaymentPurchase] = useState<SupplierPurchase | null>(null)
  const [paymentType, setPaymentType] = useState("TRANSFER")
  const [paidDate, setPaidDate] = useState(todayYmd)
  const [savingPayment, setSavingPayment] = useState(false)

  const fetchSupplier = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers/${params.id}`)
      if (!response.ok) throw new Error("Tedarikçi alınamadı")
      setSupplier((await response.json()) as SupplierDetail)
    } catch {
      toast.error("Tedarikçi yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchSupplier()
  }, [fetchSupplier])

  const payPurchase = async () => {
    if (!paymentPurchase) return

    setSavingPayment(true)
    try {
      const response = await fetch(`/api/suppliers/${params.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: paymentPurchase.id,
          amount: Number(paymentPurchase.total),
          type: paymentType,
          paidDate,
          note: `Alış borcu kapatma: ${paymentPurchase.description}`,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Ödeme oluşturulamadı")

      toast.success("Tedarikçi ödemesi kaydedildi")
      setPaymentPurchase(null)
      fetchSupplier()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ödeme oluşturulamadı")
    } finally {
      setSavingPayment(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>
  }

  if (!supplier) {
    return <div className="p-6 text-sm text-muted-foreground">Tedarikçi bulunamadı</div>
  }

  const duePurchases = supplier.purchases.filter((purchase) => purchase.status === "DUE")
  const paidPurchases = supplier.purchases.filter((purchase) => purchase.status === "PAID")

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description="Tedarikçi cari, alış ve ödeme takibi"
        actions={
          <Button variant="outline" onClick={() => router.push("/admin/suppliers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="h-4 w-4" />
              Bakiye
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-2xl font-semibold">
            {formatCurrency(supplier.balance)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              Açık Alış
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{duePurchases.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Ödenmiş Alış
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{paidPurchases.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alışlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Alış kaydı yok
                  </TableCell>
                </TableRow>
              ) : (
                supplier.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell>{purchase.description}</TableCell>
                    <TableCell>{purchase.supplierInvoiceNo || purchase.invoice?.number || "-"}</TableCell>
                    <TableCell>{formatDate(purchase.dueDate)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(purchase.total)}</TableCell>
                    <TableCell>{purchase.status === "PAID" ? "Ödendi" : "Borçlu"}</TableCell>
                    <TableCell>
                      {purchase.status === "DUE" ? (
                        <Button size="sm" variant="outline" onClick={() => setPaymentPurchase(purchase)}>
                          Öde
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ödemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Ödeme yok
                    </TableCell>
                  </TableRow>
                ) : (
                  supplier.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paidDate)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell>{payment.note || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cari Hareketler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Borç Düşen</TableHead>
                  <TableHead>Borç Artan</TableHead>
                  <TableHead>Bakiye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.accountTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Hareket yok
                    </TableCell>
                  </TableRow>
                ) : (
                  supplier.accountTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>{transactionLabel(transaction.type)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(transaction.debit)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(transaction.credit)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(transaction.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(paymentPurchase)} onOpenChange={(open) => !open && setPaymentPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Borcunu Kapat</DialogTitle>
          </DialogHeader>
          {paymentPurchase ? (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">{paymentPurchase.description}</div>
                <div className="font-mono">{formatCurrency(paymentPurchase.total)}</div>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Tarihi</Label>
                <Input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ödeme Tipi</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Nakit</SelectItem>
                    <SelectItem value="TRANSFER">Havale/EFT</SelectItem>
                    <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={payPurchase} disabled={savingPayment}>
              {savingPayment ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
