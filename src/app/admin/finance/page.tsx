"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarCheck, Percent, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { routes } from "@/lib/routes"
import { PaymentList } from "@/components/payment-list"
import { PageHeader } from "@/components/page-header"

type SummaryTotal = {
  currency: string
  amount: string
}

type SummaryBucket = {
  count: number
  totals: SummaryTotal[]
}

type FinanceSummary = {
  totalCount: number
  paid: SummaryBucket
  paidTax: SummaryBucket
  open: SummaryBucket
  due: SummaryBucket
  late: SummaryBucket
  paidThisMonth: SummaryBucket
}

const emptyBucket: SummaryBucket = {
  count: 0,
  totals: [],
}

const formatMoney = (amount: string, currency: string) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount} ${currency}`

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatTotals = (bucket: SummaryBucket) => {
  if (bucket.totals.length === 0) return formatMoney("0", "TRY")
  return bucket.totals.map((total) => formatMoney(total.amount, total.currency)).join(" + ")
}

function FinanceSummaryCards() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch("/api/payments?summary=true", { cache: "no-store" })
        if (!response.ok) throw new Error("Finans özeti alınamadı")
        setSummary(await response.json())
      } catch {
        setError(true)
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  const cards = [
    {
      title: "Tahsil Edilen",
      value: formatTotals(summary?.paid || emptyBucket),
      meta: "KDV hariç tutar",
      icon: Wallet,
    },
    {
      title: "KDV",
      value: formatTotals(summary?.paidTax || emptyBucket),
      meta: `${summary?.paidTax.count || 0} tahsilat`,
      icon: Percent,
    },
    {
      title: "Gecikmiş",
      value: formatTotals(summary?.late || emptyBucket),
      meta: `${summary?.late.count || 0} gecikmiş`,
      icon: AlertTriangle,
    },
    {
      title: "Bu Ay",
      value: formatTotals(summary?.paidThisMonth || emptyBucket),
      meta: `${summary?.paidThisMonth.count || 0} ödeme`,
      icon: CalendarCheck,
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="flex min-h-[104px] items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{card.title}</p>
                  {loading ? (
                    <Skeleton className="mt-3 h-7 w-28" />
                  ) : (
                    <div className="mt-2 break-words text-xl font-semibold leading-tight tracking-normal">
                      {card.value}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {error ? "Özet alınamadı" : card.meta}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminFinancePage() {
  const router = useRouter()
  return (
    <div className="space-y-5">
      <PageHeader
        title="Finans Yönetimi"
        description="Ödemeleri ve finansal işlemleri yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Finans" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/finance/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ödeme
          </Button>
        }
      />
      <FinanceSummaryCards />
      <PaymentList />
    </div>
  )
}
