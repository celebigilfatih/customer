"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Plus, RotateCcw, Search, ShoppingCart, Wallet } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { routes } from "@/lib/routes"

type SaleStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "CANCELLED"

type Sale = {
  id: string
  number: string
  status: SaleStatus
  total: string
  paidAmount: string
  remainingAmount: string
  issueDate: string
  dueDate: string
  customer: {
    id: string
    fullName: string
    club: string
  }
  itemLabels: string[]
}

type SalesResponse = {
  data: Sale[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  summary: {
    activeCount: number
    cancelledCount: number
    total: string
    paid: string
    remaining: string
    cancelledTotal: string
  }
}

const ALL_VALUE = "__all__"

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

function formatMoney(value: string | number) {
  const number = Number(value)
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export default function AdminSalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<SalesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL_VALUE)
  const [page, setPage] = useState(1)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search.trim()) params.set("search", search.trim())
    if (status !== ALL_VALUE) params.set("status", status)
    return params.toString()
  }, [page, search, status])

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/sales?${query}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Satışlar alınamadı")
        setSales(await response.json())
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [query])

  const cards = [
    {
      title: "Aktif Satış",
      value: sales?.summary.activeCount.toString() ?? "0",
      meta: formatMoney(sales?.summary.total ?? "0"),
      icon: ShoppingCart,
    },
    {
      title: "Tahsil Edilen",
      value: formatMoney(sales?.summary.paid ?? "0"),
      meta: "Satış tahsilatı",
      icon: Wallet,
    },
    {
      title: "Kalan",
      value: formatMoney(sales?.summary.remaining ?? "0"),
      meta: "Açık bakiye",
      icon: Wallet,
    },
    {
      title: "İptal",
      value: sales?.summary.cancelledCount.toString() ?? "0",
      meta: formatMoney(sales?.summary.cancelledTotal ?? "0"),
      icon: RotateCcw,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Satışlar"
        description="Satış faturalarını, tahsilat durumunu ve güvenli iptalleri yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Satışlar" },
        ]}
        actions={
          <Button onClick={() => router.push(routes.admin.salesNew)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Satış
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="flex min-h-[92px] items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{loading ? "-" : card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{loading ? "Yükleniyor" : card.meta}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/30">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Satış Kayıtları</h2>
            <p className="text-sm text-muted-foreground">
              Fatura, müşteri ve satış kalemine göre arayın.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_auto] lg:w-[640px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                className="pl-9"
                placeholder="Fatura, müşteri, hizmet..."
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tüm durumlar</SelectItem>
                <SelectItem value="ISSUED">Açık</SelectItem>
                <SelectItem value="PARTIAL">Kısmi</SelectItem>
                <SelectItem value="PAID">Ödendi</SelectItem>
                <SelectItem value="CANCELLED">İptal</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setStatus(ALL_VALUE)
                setPage(1)
              }}
              disabled={!search && status === ALL_VALUE}
            >
              Temizle
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Satış Kalemi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Tahsilat</TableHead>
              <TableHead>Kalan</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Satışlar yükleniyor
                </TableCell>
              </TableRow>
            ) : sales && sales.data.length > 0 ? (
              sales.data.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{sale.customer.club || sale.customer.fullName}</div>
                    {sale.customer.club && (
                      <div className="text-xs text-muted-foreground">{sale.customer.fullName}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="truncate">{sale.itemLabels[0] || "-"}</div>
                    {sale.itemLabels.length > 1 && (
                      <div className="text-xs text-muted-foreground">
                        +{sale.itemLabels.length - 1} kalem
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusClasses[sale.status]} variant="secondary">
                      {statusLabels[sale.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(sale.total)}</TableCell>
                  <TableCell>{formatMoney(sale.paidAmount)}</TableCell>
                  <TableCell>{formatMoney(sale.remainingAmount)}</TableCell>
                  <TableCell>{formatDate(sale.issueDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="icon" variant="ghost" aria-label="Satış detayı">
                      <Link href={`/admin/sales/${sale.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Satış kaydı bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-center gap-3 border-t p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!sales || sales.pagination.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground">
            Sayfa {sales?.pagination.page ?? page} / {sales?.pagination.totalPages ?? 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!sales || sales.pagination.page >= sales.pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sonraki
          </Button>
        </div>
      </Card>
    </div>
  )
}
