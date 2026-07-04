"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, CreditCard, Download, FileText, Filter, RefreshCw, Repeat, WalletCards } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { LoadingCard } from "@/components/loading-card"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { routes } from "@/lib/routes"

type ReportSource = "payments" | "subscriptions"
type PaymentStatusFilter = "ALL" | "DUE" | "LATE" | "PAID"
type PaymentItem = {
  id: string
  customerId: string
  amount: string
  currency: string
  dueDate: string
  status: "DUE" | "LATE" | "PAID"
}
type SubscriptionItem = {
  id: string
  customerId: string
  name: string
  price: string
  startDate: string
  endDate: string
  status: "ACTIVE" | "EXPIRED" | "CANCELED"
}
type SimpleCustomer = { id: string; fullName: string; club?: string | null }

const ALL_VALUE = "ALL"

export default function AdminReportsPage() {
  const [source, setSource] = useState<ReportSource>("payments")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>("ALL")
  const [currency, setCurrency] = useState(ALL_VALUE)
  const [customerId, setCustomerId] = useState(ALL_VALUE)
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payRes, subRes, custRes] = await Promise.all([
        fetch("/api/payments?limit=100"),
        fetch("/api/subscriptions?all=true"),
        fetch("/api/customers?limit=100"),
      ])
      if (!payRes.ok || !subRes.ok || !custRes.ok) throw new Error("Veri alınamadı")
      const payJson = await payRes.json()
      const subJson = await subRes.json()
      const custJson = await custRes.json()
      setPayments(payJson.data || [])
      setSubscriptions(subJson.data || [])
      setCustomers((custJson.data || custJson || []).map((c: SimpleCustomer) => ({ id: c.id, fullName: c.fullName, club: c.club })))
    } catch {
      toast.error("Rapor verileri yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const customerMap = useMemo(() => {
    return customers.reduce<Record<string, string>>((acc, customer) => {
      acc[customer.id] = customer.club || customer.fullName
      return acc
    }, {})
  }, [customers])

  const inRange = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    const from = fromDate ? new Date(fromDate) : undefined
    const to = toDate ? new Date(toDate) : undefined
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }, [fromDate, toDate])

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => paymentStatus === ALL_VALUE || payment.status === paymentStatus)
      .filter((payment) => currency === ALL_VALUE || (currency === "__EMPTY__" ? !payment.currency : payment.currency === currency))
      .filter((payment) => customerId === ALL_VALUE || payment.customerId === customerId)
      .filter((payment) => inRange(payment.dueDate))
  }, [payments, paymentStatus, currency, customerId, inRange])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => customerId === ALL_VALUE || subscription.customerId === customerId)
      .filter((subscription) => inRange(subscription.endDate))
  }, [subscriptions, customerId, inRange])

  const paymentTotalsByCurrency = useMemo(() => {
    return filteredPayments.reduce<Record<string, number>>((acc, payment) => {
      const key = payment.currency || ""
      acc[key] = (acc[key] || 0) + (parseInt(payment.amount, 10) || 0)
      return acc
    }, {})
  }, [filteredPayments])

  const paymentCountsByStatus = useMemo(() => {
    return filteredPayments.reduce<Record<string, number>>((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1
      return acc
    }, {})
  }, [filteredPayments])

  const subscriptionCountsByStatus = useMemo(() => {
    return filteredSubscriptions.reduce<Record<string, number>>((acc, subscription) => {
      acc[subscription.status] = (acc[subscription.status] || 0) + 1
      return acc
    }, {})
  }, [filteredSubscriptions])

  const currencyOptions = useMemo(() => {
    return Array.from(new Set(payments.map((payment) => payment.currency || ""))).sort()
  }, [payments])

  const paymentTotal = filteredPayments.reduce((sum, payment) => sum + (parseInt(payment.amount, 10) || 0), 0)
  const subscriptionTotal = filteredSubscriptions.reduce((sum, subscription) => sum + (parseInt(subscription.price, 10) || 0), 0)
  const currentRows = source === "payments" ? filteredPayments.length : filteredSubscriptions.length
  const activeFilterCount = [fromDate, toDate, customerId !== ALL_VALUE, source === "payments" && paymentStatus !== ALL_VALUE, source === "payments" && currency !== ALL_VALUE].filter(Boolean).length
  const barMaxPayment = Object.values(paymentTotalsByCurrency).reduce((max, value) => Math.max(max, value), 0)

  const clearFilters = () => {
    setFromDate("")
    setToDate("")
    setCustomerId(ALL_VALUE)
    setPaymentStatus(ALL_VALUE)
    setCurrency(ALL_VALUE)
  }

  const exportCSV = () => {
    try {
      const rows: string[] = []
      if (source === "payments") {
        rows.push(["id", "customer", "amount", "currency", "dueDate", "status"].join(","))
        filteredPayments.forEach((payment) => {
          rows.push([payment.id, customerMap[payment.customerId] || payment.customerId, String(parseInt(payment.amount, 10) || 0), payment.currency, payment.dueDate, payment.status].join(","))
        })
      } else {
        rows.push(["id", "customer", "name", "price", "startDate", "endDate", "status"].join(","))
        filteredSubscriptions.forEach((subscription) => {
          rows.push([subscription.id, customerMap[subscription.customerId] || subscription.customerId, subscription.name, String(parseInt(subscription.price, 10) || 0), subscription.startDate, subscription.endDate, subscription.status].join(","))
        })
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = source === "payments" ? "tahsilat_raporu.csv" : "abonelik_raporu.csv"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("CSV dışa aktarma başarısız")
    }
  }

  const exportPDF = () => {
    try {
      window.print()
    } catch {
      toast.error("PDF oluşturma başarısız")
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR")

  return (
    <div className="space-y-4">
      <PageHeader
        className="gap-3"
        title="Raporlar"
        description="Tahsilat ve süreli hizmet raporlarını inceleyin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Raporlar" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        }
      />
      <style>{`@media print{.no-print{display:none !important}.print-card{box-shadow:none;border:none}}`}</style>

      <Card className="rounded-lg py-0">
        <CardContent className="grid gap-0 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Kayıt", value: currentRows.toLocaleString("tr-TR"), helper: source === "payments" ? "tahsilat" : "abonelik", icon: BarChart3 },
            { label: "Toplam", value: (source === "payments" ? paymentTotal : subscriptionTotal).toLocaleString("tr-TR"), helper: source === "payments" ? "tahsilat tutarı" : "abonelik değeri", icon: WalletCards },
            { label: source === "payments" ? "Gecikmiş" : "Aktif", value: source === "payments" ? paymentCountsByStatus.LATE || 0 : subscriptionCountsByStatus.ACTIVE || 0, helper: source === "payments" ? "ödeme" : "abonelik", icon: source === "payments" ? CreditCard : Repeat },
            { label: "Filtre", value: activeFilterCount, helper: "aktif kriter", icon: Filter },
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

      <Card className="no-print rounded-lg py-0">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex h-9 shrink-0 items-center gap-2 px-1 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtrele
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[150px_150px_150px_220px_150px_150px_auto_auto]">
              <Select value={source} onValueChange={(value) => setSource(value as ReportSource)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payments">Tahsilatlar</SelectItem>
                  <SelectItem value="subscriptions">Abonelikler</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-9" />
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-9" />
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tüm müşteriler</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.club || customer.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {source === "payments" ? (
                <>
                  <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatusFilter)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm durumlar</SelectItem>
                      <SelectItem value="DUE">Vadesi geldi</SelectItem>
                      <SelectItem value="LATE">Gecikmiş</SelectItem>
                      <SelectItem value="PAID">Ödendi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Tüm birimler</SelectItem>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option || "__EMPTY__"} value={option || "__EMPTY__"}>{option || "Belirsiz"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="hidden xl:block" />
              )}
              {activeFilterCount > 0 && (
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

      {source === "payments" ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <ReportTableCard title="Tahsilat Detayı" count={filteredPayments.length}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Vade</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}><LoadingCard header={false} rows={3} /></TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState title="Kayıt bulunamadı" description="Filtrelere uygun tahsilat kaydı yok" />
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{customerMap[payment.customerId] || payment.customerId}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell className="text-right font-medium">{(parseInt(payment.amount, 10) || 0).toLocaleString("tr-TR")}</TableCell>
                    <TableCell>{payment.currency || "-"}</TableCell>
                    <TableCell><StatusBadge status={payment.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportTableCard>

          <div className="space-y-3">
            <SidePanel title="Para Birimi Toplamları">
              {Object.entries(paymentTotalsByCurrency).length === 0 ? (
                <EmptyState title="Veri yok" description="Filtrelere uygun toplam bulunmuyor" />
              ) : Object.entries(paymentTotalsByCurrency).map(([cur, total]) => (
                <div key={cur || "_"} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cur || "Belirsiz"}</span>
                    <span className="font-semibold">{total.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${barMaxPayment ? Math.round((total / barMaxPayment) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </SidePanel>
            <SidePanel title="Durum Özeti">
              <StatusCount label="Vadesi geldi" value={paymentCountsByStatus.DUE || 0} />
              <StatusCount label="Gecikmiş" value={paymentCountsByStatus.LATE || 0} tone="danger" />
              <StatusCount label="Ödendi" value={paymentCountsByStatus.PAID || 0} tone="success" />
            </SidePanel>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <ReportTableCard title="Abonelik Detayı" count={filteredSubscriptions.length}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Abonelik</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}><LoadingCard header={false} rows={3} /></TableCell>
                  </TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <EmptyState title="Kayıt bulunamadı" description="Filtrelere uygun abonelik kaydı yok" />
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{customerMap[subscription.customerId] || subscription.customerId}</TableCell>
                    <TableCell>{subscription.name}</TableCell>
                    <TableCell>{formatDate(subscription.endDate)}</TableCell>
                    <TableCell className="text-right font-medium">{(parseInt(subscription.price, 10) || 0).toLocaleString("tr-TR")}</TableCell>
                    <TableCell><StatusBadge status={subscription.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportTableCard>

          <SidePanel title="Durum Özeti">
            <StatusCount label="Aktif" value={subscriptionCountsByStatus.ACTIVE || 0} tone="success" />
            <StatusCount label="Süresi dolmuş" value={subscriptionCountsByStatus.EXPIRED || 0} tone="danger" />
            <StatusCount label="İptal" value={subscriptionCountsByStatus.CANCELED || 0} />
          </SidePanel>
        </div>
      )}
    </div>
  )
}

function ReportTableCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card className="gap-0 rounded-lg py-0">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">{count}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">{children}</div>
      </CardContent>
    </Card>
  )
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-lg py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">{children}</CardContent>
    </Card>
  )
}

function StatusCount({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "success" | "danger" }) {
  const badgeVariant = tone === "danger" ? "destructive" : tone === "success" ? "default" : "outline"
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <Badge variant={badgeVariant}>{value}</Badge>
    </div>
  )
}
