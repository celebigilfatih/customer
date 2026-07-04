"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Plus,
  Repeat,
  Server,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

type MoneyTotal = {
  currency: string
  amount: string
}

type MoneyBucket = {
  count: number
  totals: MoneyTotal[]
}

type RecentActivity = {
  id: string
  kind: "payment" | "domain" | "hosting" | "subscription" | "proposal"
  title: string
  description: string
  status?: string
  href: string
  createdAt: string
}

type UpcomingExpiration = {
  id: string
  kind: "subscription" | "domain" | "hosting"
  label: string
  date: string | null
  href: string
}

type DashboardSummary = {
  metrics: {
    customers: number
    activeSubscriptions: number
    domains: number
    hosting: number
    openProposals: number
    upcomingExpirations: number
  }
  finance: {
    collected: MoneyBucket
    collectedToday: MoneyBucket
    open: MoneyBucket
    late: MoneyBucket
  }
  reminders: {
    paymentsDueToday: number
    domainsRenewToday: number
    subscriptionsExpireToday: number
    hostingExpireToday: number
  }
  serviceSummary: {
    subscriptions: number
    activeSubscriptions: number
    domains: number
    hosting: number
    proposals: number
    approvedProposals: number
  }
  upcomingExpirations: UpcomingExpiration[]
  recentActivities: RecentActivity[]
}

const activityIcons = {
  payment: Wallet,
  domain: Globe,
  hosting: Server,
  subscription: Repeat,
  proposal: FileText,
}

const activityLabels = {
  payment: "Tahsilat",
  domain: "Domain",
  hosting: "Hosting",
  subscription: "Abonelik",
  proposal: "Teklif",
}

const formatMoney = (bucket?: MoneyBucket) => {
  if (!bucket || bucket.totals.length === 0) return "₺0"

  return bucket.totals
    .slice(0, 2)
    .map((item) => {
      const amount = Number(item.amount)
      const formatted = Number.isFinite(amount) ? amount.toLocaleString("tr-TR") : item.amount
      return `${item.currency === "TRY" ? "₺" : item.currency} ${formatted}`
    })
    .join(" / ")
}

const formatDate = (value: string | null) => {
  if (!value) return "Belirsiz"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Belirsiz"
  return date.toLocaleDateString("tr-TR")
}

const totalReminders = (summary: DashboardSummary) =>
  summary.reminders.paymentsDueToday +
  summary.reminders.domainsRenewToday +
  summary.reminders.subscriptionsExpireToday +
  summary.reminders.hostingExpireToday

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-3 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg lg:col-span-2" />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/admin/dashboard/summary")
        if (!response.ok) {
          throw new Error("Dashboard verileri alınamadı")
        }
        const data = (await response.json()) as DashboardSummary
        setSummary(data)
      } catch {
        toast.error("Dashboard verileri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  const activeSubscriptionRatio = useMemo(() => {
    if (!summary || summary.serviceSummary.subscriptions === 0) return 0
    return Math.round((summary.serviceSummary.activeSubscriptions / summary.serviceSummary.subscriptions) * 100)
  }, [summary])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Bugünkü kararlar, uyarılar ve son hareketler."
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Dashboard" },
        ]}
      />

      {loading || !summary ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Müşteri</p>
                  <p className="mt-2 text-2xl font-semibold leading-none">{summary.metrics.customers}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Toplam kayıt</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Bugünkü Tahsilat</p>
                  <p className="mt-2 text-2xl font-semibold leading-none">{formatMoney(summary.finance.collectedToday)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{summary.finance.collectedToday.count} ödeme</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-blue-500/10">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Yakında Biten</p>
                  <p className="mt-2 text-2xl font-semibold leading-none">{summary.metrics.upcomingExpirations}</p>
                  <p className="mt-1 text-xs text-muted-foreground">30 gün içinde</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-orange-500/10">
                  <CalendarDays className="h-5 w-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Açık Teklif</p>
                  <p className="mt-2 text-2xl font-semibold leading-none">{summary.metrics.openProposals}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{summary.serviceSummary.proposals} toplam teklif</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4" />
                  Hızlı İşlemler
                </CardTitle>
                <CardDescription>En sık kullanılan akışlar</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Button variant="outline" className="h-9 justify-start" onClick={() => router.push(routes.customers.add)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Müşteri
                </Button>
                <Button variant="outline" className="h-9 justify-start" onClick={() => router.push(routes.admin.salesNew)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Direkt Satış
                </Button>
                <Button variant="outline" className="h-9 justify-start" onClick={() => router.push("/admin/proposals/add")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Yeni Teklif
                </Button>
                <Button variant="outline" className="h-9 justify-start" onClick={() => router.push(routes.admin.finance)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tahsilatlar
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {totalReminders(summary) > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  Bugünkü Uyarılar
                </CardTitle>
                <CardDescription>Bugün aksiyon gerektiren kayıtlar</CardDescription>
              </CardHeader>
              <CardContent>
                {totalReminders(summary) === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Bugün için uyarı yok"
                    description="Tahsilat, yenileme ve bitiş kayıtları güncel görünüyor."
                    className="border-0 p-4"
                  />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ReminderRow
                      label="Vadesi gelen ödeme"
                      count={summary.reminders.paymentsDueToday}
                      href={routes.admin.finance}
                    />
                    <ReminderRow
                      label="Domain yenileme"
                      count={summary.reminders.domainsRenewToday}
                      href={routes.admin.domains}
                    />
                    <ReminderRow
                      label="Abonelik bitişi"
                      count={summary.reminders.subscriptionsExpireToday}
                      href={routes.admin.subscriptions}
                    />
                    <ReminderRow
                      label="Hosting bitişi"
                      count={summary.reminders.hostingExpireToday}
                      href={routes.admin.hosting}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Son Aktiviteler
                </CardTitle>
                <CardDescription>Tahsilat, teklif ve süreli hizmet hareketleri</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.recentActivities.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="Henüz aktivite yok"
                    description="Yeni kayıtlar burada görünecek."
                    className="border-0 p-4"
                  />
                ) : (
                  <div className="space-y-2">
                    {summary.recentActivities.map((activity) => {
                      const Icon = activityIcons[activity.kind]
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => router.push(activity.href)}
                          className="flex w-full items-center justify-between rounded-md border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{activity.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {activityLabels[activity.kind]} · {activity.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-3 shrink-0">
                            {formatDate(activity.createdAt)}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Repeat className="h-4 w-4" />
                  Süreli Hizmet Özeti
                </CardTitle>
                <CardDescription>Aktif kayıtların kısa görünümü</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aktif abonelik</span>
                    <span className="font-medium">%{activeSubscriptionRatio}</span>
                  </div>
                  <Progress value={activeSubscriptionRatio} className="mt-2 h-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SummaryTile icon={Repeat} label="Abonelik" value={summary.serviceSummary.subscriptions} />
                  <SummaryTile icon={Globe} label="Domain" value={summary.serviceSummary.domains} />
                  <SummaryTile icon={Server} label="Hosting" value={summary.serviceSummary.hosting} />
                  <SummaryTile icon={FileText} label="Teklif" value={summary.serviceSummary.proposals} />
                </div>
                {summary.upcomingExpirations.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    {summary.upcomingExpirations.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left text-sm hover:bg-muted/40"
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function ReminderRow({ label, count, href }: { label: string; count: number; href: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{count} kayıt</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Repeat
  label: string
  value: number
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold leading-none">{value}</p>
    </div>
  )
}
