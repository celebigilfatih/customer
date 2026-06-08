"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { LoadingCard } from "@/components/loading-card"
import { EmptyState } from "@/components/empty-state"
import { FileDown, FileText, BarChart3, CreditCard, Repeat } from "lucide-react"

type PaymentItem = { id: string; customerId: string; amount: string; currency: string; dueDate: string; status: "DUE" | "LATE" | "PAID" }
type SubscriptionItem = { id: string; customerId: string; name: string; price: string; startDate: string; endDate: string; status: "ACTIVE" | "EXPIRED" | "CANCELED" }
type SimpleCustomer = { id: string; fullName: string }

export default function AdminReportsPage() {
  const [source, setSource] = useState<"payments" | "subscriptions">("payments")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [statusDue, setStatusDue] = useState(true)
  const [statusLate, setStatusLate] = useState(true)
  const [statusPaid, setStatusPaid] = useState(false)
  const [currency, setCurrency] = useState("ALL")
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [customerId, setCustomerId] = useState<string>("ALL")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const qs = "?limit=100"
        const [payRes, subRes, custRes] = await Promise.all([
          fetch(`/api/payments${qs}`),
          fetch(`/api/subscriptions${qs}`),
          fetch(`/api/customers${qs}`),
        ])
        if (!payRes.ok || !subRes.ok || !custRes.ok) throw new Error("Veri alınamadı")
        const payJson = await payRes.json()
        const subJson = await subRes.json()
        const custJson = await custRes.json()
        setPayments(payJson.data || [])
        setSubscriptions(subJson.data || [])
        setCustomers((custJson.data || custJson || []).map((c: { id: string; fullName: string }) => ({ id: c.id, fullName: c.fullName })))
      } catch {
        toast.error("Rapor verileri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const inRange = (dateStr: string, from?: string, to?: string) => {
    const d = new Date(dateStr)
    const f = from ? new Date(from) : undefined
    const t = to ? new Date(to) : undefined
    if (f && d < f) return false
    if (t && d > t) return false
    return true
  }

  const filteredPayments = useMemo(() => {
    const allow = new Set<string>([
      ...(statusDue ? ["DUE"] : []),
      ...(statusLate ? ["LATE"] : []),
      ...(statusPaid ? ["PAID"] : []),
    ])
    return payments
      .filter(p => allow.has(p.status))
      .filter(p => currency === "ALL" ? true : (currency === "__EMPTY__" ? !p.currency : p.currency === currency))
      .filter(p => customerId === "ALL" || p.customerId === customerId)
      .filter(p => inRange(p.dueDate, fromDate || undefined, toDate || undefined))
  }, [payments, statusDue, statusLate, statusPaid, currency, fromDate, toDate, customerId])

  const paymentTotalsByCurrency = useMemo(() => {
    return filteredPayments.reduce<Record<string, number>>((acc, p) => {
      const key = p.currency || ""
      acc[key] = (acc[key] || 0) + (parseInt(p.amount, 10) || 0)
      return acc
    }, {})
  }, [filteredPayments])

  const paymentCountsByStatus = useMemo(() => {
    return filteredPayments.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})
  }, [filteredPayments])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter(s => customerId === "ALL" || s.customerId === customerId)
      .filter(s => inRange(s.endDate, fromDate || undefined, toDate || undefined))
  }, [subscriptions, fromDate, toDate, customerId])

  const subscriptionCountsByStatus = useMemo(() => {
    return filteredSubscriptions.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {})
  }, [filteredSubscriptions])

  const barMaxPayment = useMemo(() => {
    return Object.values(paymentTotalsByCurrency).reduce((m, v) => Math.max(m, v), 0)
  }, [paymentTotalsByCurrency])

  const exportCSV = () => {
    try {
      const rows: string[] = []
      if (source === "payments") {
        rows.push(["id", "customerId", "amount", "currency", "dueDate", "status"].join(","))
        filteredPayments.forEach(p => {
          rows.push([p.id, p.customerId, String(parseInt(p.amount, 10) || 0), p.currency, p.dueDate, p.status].join(","))
        })
      } else {
        rows.push(["id", "customerId", "name", "price", "startDate", "endDate", "status"].join(","))
        filteredSubscriptions.forEach(s => {
          rows.push([s.id, s.customerId, s.name, String(parseInt(s.price, 10) || 0), s.startDate, s.endDate, s.status].join(","))
        })
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = source === "payments" ? "payments.csv" : "subscriptions.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("CSV dışa aktarma başarısız")
    }
  }

  const exportGroupedCSV = () => {
    try {
      if (source === "payments") {
        const groups = new Map<string, PaymentItem[]>()
        filteredPayments.forEach(p => {
          const k = p.customerId
          const arr = groups.get(k) || []
          arr.push(p)
          groups.set(k, arr)
        })
        groups.forEach((items, k) => {
          const customerName = customers.find(c => c.id === k)?.fullName || k
          const rows = [["id", "amount", "currency", "dueDate", "status"].join(",")]
          items.forEach(p => rows.push([p.id, String(parseInt(p.amount, 10) || 0), p.currency, p.dueDate, p.status].join(",")))
          const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `payments_${customerName.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`
          a.click()
          URL.revokeObjectURL(url)
        })
      } else {
        const groups = new Map<string, SubscriptionItem[]>()
        filteredSubscriptions.forEach(s => {
          const k = s.customerId
          const arr = groups.get(k) || []
          arr.push(s)
          groups.set(k, arr)
        })
        groups.forEach((items, k) => {
          const customerName = customers.find(c => c.id === k)?.fullName || k
          const rows = [["id", "name", "price", "startDate", "endDate", "status"].join(",")]
          items.forEach(s => rows.push([s.id, s.name, String(parseInt(s.price, 10) || 0), s.startDate, s.endDate, s.status].join(",")))
          const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `subscriptions_${customerName.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`
          a.click()
          URL.revokeObjectURL(url)
        })
      }
    } catch {
      toast.error("Gruplu CSV dışa aktarma başarısız")
    }
  }

  const exportPDF = () => {
    try {
      window.print()
    } catch {
      toast.error("PDF oluşturma başarısız")
    }
  }

  const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raporlar"
        description="Detaylı finansal ve operasyonel raporlar"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Raporlar" },
        ]}
      />
      <style>{`@media print{.no-print{display:none !important}.print-card{box-shadow:none;border:none}}`}</style>

      <Card className="no-print print-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Rapor Filtreleri</CardTitle>
          </div>
          <CardDescription>
            Raporlamak istediğiniz veri setini ve tarih aralığını seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Select onValueChange={(v) => setSource(v as ("payments" | "subscriptions"))} defaultValue={source}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payments">Ödemeler</SelectItem>
                  <SelectItem value="subscriptions">Abonelikler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input placeholder="Başlangıç YYYY-MM-DD" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Input placeholder="Bitiş YYYY-MM-DD" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <Select onValueChange={(v) => setCustomerId(v)} defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm müşteriler</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {source === "payments" && (
              <div>
                <Select onValueChange={(v) => setCurrency(v)} defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm para birimleri</SelectItem>
                    {Object.keys(paymentTotalsByCurrency).map((c) => {
                      const safeC = c || ""
                      const val = safeC === "" ? "__EMPTY__" : safeC
                      const label = safeC || "Belirsiz"
                      return (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            {source === "payments" && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Durumlar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => { setStatusDue(true); setStatusLate(true); setStatusPaid(true) }}>Hepsi</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { setStatusDue(false); setStatusLate(false); setStatusPaid(false) }}>Temizle</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={statusDue} onCheckedChange={(v) => setStatusDue(Boolean(v))}>DUE</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusLate} onCheckedChange={(v) => setStatusLate(Boolean(v))}>LATE</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusPaid} onCheckedChange={(v) => setStatusPaid(Boolean(v))}>PAID</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportGroupedCSV}>
              <FileText className="mr-2 h-4 w-4" />
              Müşteri CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {source === "payments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <CardTitle>Para Birimi Toplamları</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <LoadingCard header={false} rows={3} />
              ) : Object.entries(paymentTotalsByCurrency).length === 0 ? (
                <EmptyState title="Veri yok" description="Filtrelere uygun ödeme bulunmuyor" />
              ) : (
                Object.entries(paymentTotalsByCurrency).map(([cur, total]) => (
                  <div key={cur || "_"} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cur || "Belirsiz"}</span>
                      <span className="font-bold">{total.toLocaleString("tr-TR")}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${barMaxPayment ? Math.round((total / barMaxPayment) * 100) : 0}%` }} 
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <CardTitle>Duruma Göre Sayı</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Vadesi Geldi</span>
                <Badge variant="outline">{paymentCountsByStatus["DUE"] || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Gecikmiş</span>
                <Badge variant="destructive">{paymentCountsByStatus["LATE"] || 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Ödendi</span>
                <Badge variant="default">{paymentCountsByStatus["PAID"] || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {source === "payments" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Detaylı Liste</CardTitle>
              <Badge variant="secondary">{filteredPayments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vade</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{fmt(p.dueDate)}</TableCell>
                    <TableCell className="font-medium">{parseInt(p.amount, 10).toLocaleString("tr-TR")}</TableCell>
                    <TableCell>{p.currency}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <EmptyState title="Kayıt bulunamadı" description="Filtrelere uygun ödeme kaydı yok" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {source === "subscriptions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border">
            <CardHeader>
              <CardTitle>Duruma Göre Sayı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span>ACTIVE</span><span className="font-semibold">{subscriptionCountsByStatus["ACTIVE"] || 0}</span></div>
              <div className="flex items-center justify-between text-sm"><span>EXPIRED</span><span className="font-semibold">{subscriptionCountsByStatus["EXPIRED"] || 0}</span></div>
              <div className="flex items-center justify-between text-sm"><span>CANCELED</span><span className="font-semibold">{subscriptionCountsByStatus["CANCELED"] || 0}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {source === "subscriptions" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              <CardTitle>Detaylı Liste</CardTitle>
              <Badge variant="secondary">{filteredSubscriptions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{fmt(s.endDate)}</TableCell>
                    <TableCell>{parseInt(s.price, 10).toLocaleString("tr-TR")}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <EmptyState title="Kayıt bulunamadı" description="Filtrelere uygun abonelik kaydı yok" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
