"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Bell, CalendarDays, Wallet, Users, Repeat, TrendingUp, ArrowUpRight, ArrowDownRight,
  ArrowRight, AlertCircle, CheckCircle2, Clock, Package, Globe, Server, Activity,
  CreditCard, FileText, Briefcase, Zap, MoreHorizontal, Plus, ExternalLink,
  BarChart3, PieChart, DollarSign, RefreshCw, Filter, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { PageHeader } from "@/components/page-header"
import { LoadingMetric, LoadingCard } from "@/components/loading-card"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"

type SubscriptionItem = { id: string; name: string; endDate: string; status: string }
type DomainItem = { id: string; name: string; renewDate: string; registrar: string }
type HostingItem = { id: string; package: string; endDate: string }
type PaymentItem = { id: string; amount: string; currency: string; dueDate: string; status: string }

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [domains, setDomains] = useState<DomainItem[]>([])
  const [hosting, setHosting] = useState<HostingItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [customersTotal, setCustomersTotal] = useState<number>(0)
  const [upcomingEndDays, setUpcomingEndDays] = useState<number>(30)
  const [upcomingPayDays, setUpcomingPayDays] = useState<number>(14)
  const [showEndSubs, setShowEndSubs] = useState(true)
  const [showEndDomains, setShowEndDomains] = useState(true)
  const [showEndHosting, setShowEndHosting] = useState(true)
  const [filterCurrency, setFilterCurrency] = useState<string>("ALL")
  const [statusDue, setStatusDue] = useState(true)
  const [statusLate, setStatusLate] = useState(true)
  const [statusPaid, setStatusPaid] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const qs = "?limit=100"
        const [subsRes, domRes, hostRes, payRes, custRes] = await Promise.all([
          fetch(`/api/subscriptions${qs}`),
          fetch(`/api/domains${qs}`),
          fetch(`/api/hosting${qs}`),
          fetch(`/api/payments${qs}`),
          fetch(`/api/customers?page=1&limit=1`),
        ])
        if (!subsRes.ok || !domRes.ok || !hostRes.ok || !payRes.ok || !custRes.ok) {
          throw new Error("Veriler alınamadı")
        }
        const subsJson = await subsRes.json()
        const domJson = await domRes.json()
        const hostJson = await hostRes.json()
        const payJson = await payRes.json()
        const custJson = await custRes.json()
        setSubscriptions(subsJson.data || [])
        setDomains(domJson.data || [])
        setHosting(hostJson.data || [])
        setPayments(payJson.data || [])
        setCustomersTotal(custJson.pagination?.total || 0)
      } catch {
        toast.error("Dashboard verileri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const addDays = (date: Date, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  const isSameDay = (dateStr: string, ref: Date) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
  }

  const inRange = (dateStr: string, start: Date, end: Date) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return false
    return d >= start && d <= end
  }

  const remindersToday = useMemo(() => {
    const paymentsDueToday = payments.filter(p => p.status !== "PAID" && isSameDay(p.dueDate, today))
    const domainRenewToday = domains.filter(d => isSameDay(d.renewDate, today))
    const subsExpireToday = subscriptions.filter(s => isSameDay(s.endDate, today))
    const hostingExpireToday = hosting.filter(h => isSameDay(h.endDate, today))
    return {
      paymentsDueToday,
      domainRenewToday,
      subsExpireToday,
      hostingExpireToday,
      totalCount: paymentsDueToday.length + domainRenewToday.length + subsExpireToday.length + hostingExpireToday.length,
    }
  }, [payments, domains, subscriptions, hosting, today])

  const upcomingEndRange = useMemo(() => addDays(today, upcomingEndDays), [today, upcomingEndDays])
  const upcomingEnds = useMemo(() => {
    const items: { label: string; date: string }[] = []
    if (showEndSubs) {
      subscriptions.forEach(s => {
        if (inRange(s.endDate, today, upcomingEndRange)) items.push({ label: `Abonelik: ${s.name}`, date: s.endDate })
      })
    }
    if (showEndDomains) {
      domains.forEach(d => {
        if (inRange(d.renewDate, today, upcomingEndRange)) items.push({ label: `Domain: ${d.name}`, date: d.renewDate })
      })
    }
    if (showEndHosting) {
      hosting.forEach(h => {
        if (inRange(h.endDate, today, upcomingEndRange)) items.push({ label: `Hosting: ${h.package}`, date: h.endDate })
      })
    }
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6)
  }, [subscriptions, domains, hosting, today, upcomingEndRange, showEndSubs, showEndDomains, showEndHosting])

  const upcomingPayRange = useMemo(() => addDays(today, upcomingPayDays), [today, upcomingPayDays])
  const upcomingPayments = useMemo(() => {
    const statusAllow = new Set<string>([
      ...(statusDue ? ["DUE"] : []),
      ...(statusLate ? ["LATE"] : []),
      ...(statusPaid ? ["PAID"] : []),
    ])
    const listAll = payments.filter(p => statusAllow.has(p.status) && inRange(p.dueDate, today, upcomingPayRange))
    const listFiltered = listAll.filter(p => {
      if (filterCurrency === "ALL") return true
      if (filterCurrency === "__EMPTY__") return !p.currency
      return p.currency === filterCurrency
    })
    const currencyTotals = listFiltered.reduce<Record<string, number>>((acc, p) => {
      const key = p.currency || ""
      acc[key] = (acc[key] || 0) + (parseInt(p.amount, 10) || 0)
      return acc
    }, {})
    const totalFiltered = listFiltered.reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)
    return { list: listFiltered.slice(0, 6), total: totalFiltered, totalsByCurrency: currencyTotals, currencies: Object.keys(currencyTotals) }
  }, [payments, today, upcomingPayRange, filterCurrency, statusDue, statusLate, statusPaid])

  const metrics = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.status === "ACTIVE").length
    const upcomingEndsCount = (showEndSubs ? subscriptions.filter(s => inRange(s.endDate, today, upcomingEndRange)).length : 0)
      + (showEndDomains ? domains.filter(d => inRange(d.renewDate, today, upcomingEndRange)).length : 0)
      + (showEndHosting ? hosting.filter(h => inRange(h.endDate, today, upcomingEndRange)).length : 0)
    const duePaymentsList = payments.filter(p => ["DUE", "LATE"].includes(p.status) && inRange(p.dueDate, today, upcomingPayRange))
    const duePaymentsTotal = duePaymentsList.reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)
    return { activeSubs, upcomingEndsCount, duePaymentsTotal, customersTotal }
  }, [subscriptions, domains, hosting, payments, today, upcomingEndRange, upcomingPayRange, showEndSubs, showEndDomains, showEndHosting, customersTotal])

  const fmt = (dateStr: string) => {
    if (!dateStr) return "Belirsiz"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Belirsiz"
    return d.toLocaleDateString("tr-TR")
  }

  // Calculate additional metrics
  const extendedMetrics = useMemo(() => {
    const totalSubs = subscriptions.length
    const expiredSubs = subscriptions.filter(s => s.status === "EXPIRED" || new Date(s.endDate) < today).length
    const totalDomains = domains.length
    const totalHosting = hosting.length
    const paidPayments = payments.filter(p => p.status === "PAID").length
    const duePayments = payments.filter(p => p.status === "DUE").length
    const latePayments = payments.filter(p => p.status === "LATE").length
    
    // Calculate total revenue from paid payments
    const totalRevenue = payments
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)
    
    // Calculate pending revenue
    const pendingRevenue = payments
      .filter(p => ["DUE", "LATE"].includes(p.status))
      .reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)
    
    return {
      totalSubs,
      expiredSubs,
      totalDomains,
      totalHosting,
      paidPayments,
      duePayments,
      latePayments,
      totalRevenue,
      pendingRevenue,
      activeSubsPercent: totalSubs > 0 ? Math.round((metrics.activeSubs / totalSubs) * 100) : 0
    }
  }, [subscriptions, domains, hosting, payments, today, metrics.activeSubs])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Müşteri takip sistemine hoş geldiniz. İşte bugünkü özet."
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Dashboard" },
        ]}
      />
      
      {/* Main Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingMetric />
          <LoadingMetric />
          <LoadingMetric />
          <LoadingMetric />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customersTotal}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-600 font-medium">Aktif müşteriler</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Abonelik</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Repeat className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubs}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={extendedMetrics.activeSubsPercent} className="h-1 w-16" />
              <p className="text-xs text-muted-foreground">%{extendedMetrics.activeSubsPercent}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yakında Biten</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingEndsCount}</div>
            <p className="text-xs text-muted-foreground">{upcomingEndDays} gün içinde bitecek</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Tahsilat</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.duePaymentsTotal.toLocaleString("tr-TR")}</div>
            <p className="text-xs text-muted-foreground">{upcomingPayDays} gün içinde</p>
          </CardContent>
        </Card>
      </div>
      )}
      {/* Quick Actions & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
            </div>
            <CardDescription>Sık kullanılan işlemlere hızlı erişim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push(routes.customers.add)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Müşteri Ekle
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/subscriptions/add')}>
              <Repeat className="mr-2 h-4 w-4" />
              Yeni Abonelik
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/proposals/add')}>
              <FileText className="mr-2 h-4 w-4" />
              Yeni Teklif
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/finance/add')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Ödeme Kaydet
            </Button>
          </CardContent>
        </Card>

        {/* Service Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">Hizmet Özeti</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.subscriptions)}>
                Tümü <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Tüm hizmetlerinizin durumu</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingCard header={false} rows={3} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Repeat className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{extendedMetrics.totalSubs}</p>
                      <p className="text-xs text-muted-foreground">Abonelik</p>
                    </div>
                  </div>
                  <Progress value={extendedMetrics.totalSubs > 0 ? (metrics.activeSubs / extendedMetrics.totalSubs) * 100 : 0} className="h-1" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{extendedMetrics.totalDomains}</p>
                      <p className="text-xs text-muted-foreground">Domain</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Server className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{extendedMetrics.totalHosting}</p>
                      <p className="text-xs text-muted-foreground">Hosting</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">-</p>
                      <p className="text-xs text-muted-foreground">Teklif</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Gelir Özeti</CardTitle>
            </div>
            <CardDescription>Ödeme durumlarına göre dağılım</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingCard header={false} rows={3} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="text-xs text-muted-foreground mb-1">Toplam Gelir</p>
                    <p className="text-xl font-bold text-green-600">{extendedMetrics.totalRevenue.toLocaleString("tr-TR")}</p>
                    <p className="text-xs text-green-600/70 mt-1">{extendedMetrics.paidPayments} ödeme</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <p className="text-xs text-muted-foreground mb-1">Bekleyen</p>
                    <p className="text-xl font-bold text-orange-600">{extendedMetrics.pendingRevenue.toLocaleString("tr-TR")}</p>
                    <p className="text-xs text-orange-600/70 mt-1">{extendedMetrics.duePayments} ödeme</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-xs text-muted-foreground mb-1">Gecikmiş</p>
                    <p className="text-xl font-bold text-red-600">
                      {payments.filter(p => p.status === "LATE").reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0).toLocaleString("tr-TR")}
                    </p>
                    <p className="text-xs text-red-600/70 mt-1">{extendedMetrics.latePayments} ödeme</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tahsilat Oranı</span>
                    <span className="font-medium">
                      {payments.length > 0 ? Math.round((extendedMetrics.paidPayments / payments.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={payments.length > 0 ? (extendedMetrics.paidPayments / payments.length) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Son Aktiviteler</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.reports)}>
                Raporlar <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <CardDescription>Son eklenen kayıtlar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingCard header={false} rows={3} />
            ) : (
              <div className="space-y-3">
                {subscriptions.slice(0, 3).map((sub, idx) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Repeat className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">Abonelik eklendi</p>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <EmptyState 
                    icon={Activity} 
                    title="Henüz aktivite yok" 
                    description="Yeni kayıtlar burada görünecek"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs Section */}
      <Tabs defaultValue="reminders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="reminders">Hatırlatmalar</TabsTrigger>
          <TabsTrigger value="expiring">Bitişler</TabsTrigger>
          <TabsTrigger value="payments">Tahsilatlar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reminders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Bugünkü Hatırlatmalar</CardTitle>
                  {remindersToday.totalCount > 0 && (
                    <Badge variant="secondary">{remindersToday.totalCount}</Badge>
                  )}
                </div>
                <CardDescription>
                  Bugün yapılması gereken işlemler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingCard header={false} rows={3} />
                ) : remindersToday.totalCount === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Bugün için hatırlatma yok"
                    description="Tüm işlemler güncel görünüyor."
                  />
                ) : (
                  <div className="space-y-3">
                    {remindersToday.paymentsDueToday.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ödeme vadesi</p>
                            <p className="text-xs text-muted-foreground">{remindersToday.paymentsDueToday.length} ödeme</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.finance)}>
                          Görüntüle <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {remindersToday.domainRenewToday.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Domain yenileme</p>
                            <p className="text-xs text-muted-foreground">{remindersToday.domainRenewToday.length} domain</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.domains)}>
                          Görüntüle <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {remindersToday.subsExpireToday.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Abonelik bitişi</p>
                            <p className="text-xs text-muted-foreground">{remindersToday.subsExpireToday.length} abonelik</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.subscriptions)}>
                          Görüntüle <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {remindersToday.hostingExpireToday.length > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Server className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Hosting bitişi</p>
                            <p className="text-xs text-muted-foreground">{remindersToday.hostingExpireToday.length} hosting</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push(routes.admin.hosting)}>
                          Görüntüle <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">Özet</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ödemeler</span>
                    <span className="font-medium">{remindersToday.paymentsDueToday.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domainler</span>
                    <span className="font-medium">{remindersToday.domainRenewToday.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Abonelikler</span>
                    <span className="font-medium">{remindersToday.subsExpireToday.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hostingler</span>
                    <span className="font-medium">{remindersToday.hostingExpireToday.length}</span>
                  </div>
                </div>
                <Separator />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Toplam İşlem</p>
                  <p className="text-3xl font-bold">{remindersToday.totalCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-orange-500" />
                  <CardTitle>Yaklaşan Bitişler</CardTitle>
                  {upcomingEnds.length > 0 && (
                    <Badge variant="secondary">{upcomingEnds.length}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => setUpcomingEndDays(parseInt(v, 10))} defaultValue={String(upcomingEndDays)}>
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 gün</SelectItem>
                      <SelectItem value="14">14 gün</SelectItem>
                      <SelectItem value="30">30 gün</SelectItem>
                      <SelectItem value="60">60 gün</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Türler</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => { setShowEndSubs(true); setShowEndDomains(true); setShowEndHosting(true) }}>Tümü</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setShowEndSubs(false); setShowEndDomains(false); setShowEndHosting(false) }}>Hiçbiri</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked={showEndSubs} onCheckedChange={(v) => setShowEndSubs(Boolean(v))}>Abonelik</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={showEndDomains} onCheckedChange={(v) => setShowEndDomains(Boolean(v))}>Domain</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={showEndHosting} onCheckedChange={(v) => setShowEndHosting(Boolean(v))}>Hosting</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardDescription>
                Yakında bitecek abonelik, domain ve hostingleri görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingCard header={false} rows={4} />
              ) : upcomingEnds.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Yaklaşan bitiş yok"
                  description="Seçili aralıkta bitecek kayıt bulunmuyor."
                />
              ) : (
                <div className="space-y-2">
                  {upcomingEnds.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{it.label}</span>
                      <Badge variant="outline">{fmt(it.date)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <CardTitle>Tahsilatlar</CardTitle>
                  {upcomingPayments.list.length > 0 && (
                    <Badge variant="secondary">{upcomingPayments.list.length}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => setUpcomingPayDays(parseInt(v, 10))} defaultValue={String(upcomingPayDays)}>
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 gün</SelectItem>
                      <SelectItem value="14">14 gün</SelectItem>
                      <SelectItem value="30">30 gün</SelectItem>
                      <SelectItem value="60">60 gün</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(v) => setFilterCurrency(v)} defaultValue="ALL">
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm para birimleri</SelectItem>
                      {upcomingPayments.currencies.map((c) => {
                        const safeC = c || ""
                        const val = safeC === "" ? "__EMPTY__" : safeC
                        const label = safeC || "Belirsiz"
                        return (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
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
              </div>
              <CardDescription>
                Yaklaşan ve gecikmiş ödemeleri görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingCard header={false} rows={4} />
              ) : upcomingPayments.list.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Ödeme bulunmuyor"
                  description="Seçili kriterlere uygun ödeme kaydı yok."
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(upcomingPayments.totalsByCurrency).map(([cur, total]) => (
                      <Card key={cur || "_"} className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="text-xs text-muted-foreground">Toplam ({cur || "Belirsiz"})</p>
                          <p className="text-lg font-bold">{total.toLocaleString("tr-TR")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {upcomingPayments.list.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Vade: {fmt(p.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={p.status} />
                          <span className="text-sm font-medium">{parseInt(p.amount, 10).toLocaleString("tr-TR")} {p.currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => router.push(routes.admin.finance)}>
                      Tüm ödemeler <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
