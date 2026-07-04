"use client"

import { useEffect, useState } from "react"
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
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
    <div className="space-y-2.5">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_120px_120px]">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="gap-0 py-0">
            <CardContent className="p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
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

  return (
    <div className="space-y-3">
      <PageHeader
        title="Genel Bakış"
        description="Bugün takip edilecek özetler ve hızlı aksiyonlar."
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Dashboard" },
        ]}
      />

      {loading || !summary ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_120px_120px]">
            <MetricTile
              label="Bugünkü Tahsilat"
              value={formatMoney(summary.finance.collectedToday)}
              helper={`${summary.finance.collectedToday.count} ödeme`}
              icon={Wallet}
              tone="blue"
            />
            <MetricTile
              label="Tahsil Edilecek"
              value={formatMoney(summary.finance.open)}
              helper={`${summary.finance.open.count} açık kayıt`}
              icon={CreditCard}
              tone="slate"
            />
            <MetricTile
              label="Gecikmiş"
              value={formatMoney(summary.finance.late)}
              helper={`${summary.finance.late.count} gecikmiş`}
              icon={AlertTriangle}
              tone={summary.finance.late.count > 0 ? "red" : "slate"}
            />
            <MetricTile
              label="Yakında Biten"
              value={summary.metrics.upcomingExpirations.toString()}
              helper="30 gün içinde"
              icon={CalendarDays}
              tone="orange"
            />
            <SmallMetric label="Müşteri" value={summary.metrics.customers} icon={Users} />
            <SmallMetric label="Açık Teklif" value={summary.metrics.openProposals} icon={FileText} />
          </div>

          <div className="grid grid-cols-1 items-start gap-2 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="gap-0 py-0">
              <CardHeader className="px-4 pb-3 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  {totalReminders(summary) > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  Bugünkü İş Listesi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                {totalReminders(summary) === 0 ? (
                  <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Bugün için vade, yenileme veya bitiş uyarısı yok.</span>
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
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
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="px-4 pb-3 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4" />
                  Hızlı İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 px-4 pb-4 pt-0">
                <QuickAction icon={Plus} label="Yeni Müşteri" onClick={() => router.push(routes.customers.add)} />
                <QuickAction icon={ShoppingCart} label="Yeni Satış" onClick={() => router.push(routes.admin.salesNew)} />
                <QuickAction icon={FileText} label="Yeni Teklif" onClick={() => router.push("/admin/proposals/add")} />
                <QuickAction icon={CreditCard} label="Tahsilatlar" onClick={() => router.push(routes.admin.finance)} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
            <Card className="gap-0 py-0">
              <CardHeader className="px-4 pb-3 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Son Aktiviteler
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {summary.recentActivities.length === 0 ? (
                  <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    Henüz aktivite yok. Yeni kayıtlar burada görünecek.
                  </div>
                ) : (
                  <div className="divide-y rounded-md border">
                    {summary.recentActivities.map((activity) => {
                      const Icon = activityIcons[activity.kind]
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => router.push(activity.href)}
                          className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold leading-snug">{activity.title}</p>
                              <p className="mt-1 truncate text-xs leading-snug text-muted-foreground">
                                {activityLabels[activity.kind]} · {activity.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 font-normal">
                            {formatDate(activity.createdAt)}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="px-4 pb-3 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Repeat className="h-4 w-4" />
                  Süreli Hizmet Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                <div className="grid grid-cols-1 gap-3">
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
                        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/40"
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

type MetricTone = "blue" | "orange" | "red" | "slate"

const metricToneClassNames: Record<MetricTone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-muted/40 text-muted-foreground border-border",
}

function MetricTile({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone: MetricTone
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase leading-tight text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold leading-none">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${metricToneClassNames[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function SmallMetric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex h-full items-center gap-2 p-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-none">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="h-10 justify-start gap-2 px-3 font-semibold" onClick={onClick}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}

function ReminderRow({ label, count, href }: { label: string; count: number; href: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="flex min-h-16 items-center justify-between gap-3 rounded-md border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <div>
        <p className="text-sm font-semibold leading-snug">{label}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{count} kayıt</p>
      </div>
      <div className="flex items-center gap-2">
        {count > 0 ? (
          <Badge className="bg-orange-500 hover:bg-orange-600">{count}</Badge>
        ) : (
          <Badge variant="outline" className="font-normal">0</Badge>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-md border bg-muted/20 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate text-xs leading-snug text-muted-foreground">{label}</span>
      </div>
      <p className="shrink-0 text-lg font-semibold leading-none">{value}</p>
    </div>
  )
}
