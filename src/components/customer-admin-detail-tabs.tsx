"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Edit,
  FileText,
  MapPin,
  Phone,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react"
import { CustomerWithNotes } from "@/lib/types"
import { routes } from "@/lib/routes"
import { PageHeader } from "@/components/page-header"
import { CustomerNotes } from "@/components/customer-notes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

type DetailTab = "general" | "accounting" | "transactions"

type DecimalValue = string | number | null | undefined

type AccountTransaction = {
  id: string
  type: string
  debit: DecimalValue
  credit: DecimalValue
  balance: DecimalValue
  taxExcludedDebit?: DecimalValue
  taxExcludedCredit?: DecimalValue
  taxExcludedBalance?: DecimalValue
  description: string | null
  displayDescription?: string | null
  createdAt: string
  proposal?: { number: string; title: string } | null
  invoice?: { number: string } | null
  payment?: { type: string; date: string } | null
}

type AccountingSummary = {
  totalDebit: number
  totalCredit: number
  balance: number
  taxExcludedTotalDebit?: number
  taxExcludedTotalCredit?: number
  taxExcludedBalance?: number
}

type AccountingResponse = {
  transactions: AccountTransaction[]
  summary: AccountingSummary
}

type Props = {
  customerId: string
  initialTab: string
}

function normalizeTab(value: string): DetailTab {
  if (value === "accounting" || value === "transactions") return value
  return "general"
}

function toNumber(value: DecimalValue) {
  return Number(value ?? 0)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value)
}

function GrossAmountText({ label, value }: { label: string; value: number }) {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {label}: <span className="font-mono">{formatCurrency(value)}</span>
    </p>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getBalanceBadge(balance: number) {
  if (balance > 0) return <Badge className="bg-red-500 hover:bg-red-600">Borçlu</Badge>
  if (balance < 0) return <Badge className="bg-green-600 hover:bg-green-700">Alacaklı</Badge>
  return <Badge variant="outline">Sıfır</Badge>
}

function getTransactionLabel(type: string) {
  const labels: Record<string, string> = {
    OPENING_BALANCE: "Açılış",
    PROPOSAL_DEBT: "Teklif Borcu",
    INVOICE_DEBT: "Fatura Borcu",
    PAYMENT_CREDIT: "Tahsilat",
    MANUAL_ADJUSTMENT: "Düzeltme",
  }
  return labels[type] ?? type
}

function getReference(transaction: AccountTransaction) {
  if (transaction.proposal) return transaction.proposal.number
  if (transaction.invoice) return transaction.invoice.number
  if (transaction.payment) return "Tahsilat"
  return "-"
}

function TransactionTable({
  transactions,
  emptyText,
}: {
  transactions: AccountTransaction[]
  emptyText: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarih</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Tutar KDV Hariç</TableHead>
          <TableHead>Açıklama</TableHead>
          <TableHead>Referans</TableHead>
          <TableHead>Bakiye KDV Hariç</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => {
            const debit = toNumber(transaction.debit)
            const credit = toNumber(transaction.credit)
            const taxExcludedDebit = toNumber(transaction.taxExcludedDebit ?? transaction.debit)
            const taxExcludedCredit = toNumber(transaction.taxExcludedCredit ?? transaction.credit)
            const isDebit = debit > 0
            const grossAmount = isDebit ? debit : credit
            const taxExcludedAmount = isDebit ? taxExcludedDebit : taxExcludedCredit
            const grossBalance = toNumber(transaction.balance)
            const taxExcludedBalance = toNumber(transaction.taxExcludedBalance ?? transaction.balance)
            const displayDescription = transaction.displayDescription || transaction.description || "-"
            const shouldShowLedgerDescription =
              transaction.description && transaction.description !== displayDescription

            return (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm">{formatDate(transaction.createdAt)}</TableCell>
                <TableCell>
                  <Badge
                    variant={isDebit ? "destructive" : "default"}
                    className={isDebit ? "w-fit gap-1" : "w-fit gap-1 bg-green-600 hover:bg-green-700"}
                  >
                    {isDebit ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
                    {getTransactionLabel(transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-mono font-semibold">{formatCurrency(taxExcludedAmount)}</div>
                  <div className="text-xs text-muted-foreground">Brüt/Yasal: {formatCurrency(grossAmount)}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{displayDescription}</div>
                  {shouldShowLedgerDescription ? (
                    <div className="text-xs text-muted-foreground">{transaction.description}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{getReference(transaction)}</TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{formatCurrency(taxExcludedBalance)}</div>
                  <div className="text-xs text-muted-foreground">Brüt/Yasal: {formatCurrency(grossBalance)}</div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}

export function CustomerAdminDetailTabs({ customerId, initialTab }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DetailTab>(() => normalizeTab(initialTab))
  const [customer, setCustomer] = useState<CustomerWithNotes | null>(null)
  const [accounting, setAccounting] = useState<AccountingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [customerResponse, accountingResponse] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/accounting/customers/${customerId}`),
      ])

      if (!customerResponse.ok) throw new Error("Müşteri bilgileri alınamadı")
      if (!accountingResponse.ok) throw new Error("Cari bilgiler alınamadı")

      setCustomer(await customerResponse.json())
      const accountingData = await accountingResponse.json()
      setAccounting({
        transactions: accountingData.transactions || [],
        summary: accountingData.summary || { totalDebit: 0, totalCredit: 0, balance: 0 },
      })
    } catch {
      toast.error("Müşteri detayları yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab))
  }, [initialTab])

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value)
    setActiveTab(nextTab)
    const suffix = nextTab === "general" ? "" : `?tab=${nextTab}`
    router.replace(`${routes.customers.detail(customerId)}${suffix}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!customer || !accounting) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <User className="mb-3 h-10 w-10" />
          <p>Müşteri bulunamadı</p>
        </CardContent>
      </Card>
    )
  }

  const summary = accounting.summary
  const taxExcludedSummary = {
    totalDebit: summary.taxExcludedTotalDebit ?? summary.totalDebit,
    totalCredit: summary.taxExcludedTotalCredit ?? summary.totalCredit,
    balance: summary.taxExcludedBalance ?? summary.balance,
  }
  const recentTransactions = accounting.transactions.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.fullName}
        description={customer.club || "Müşteri detayları"}
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Müşteriler", href: routes.customers.list },
          { label: customer.fullName },
        ]}
        actions={
          <Button onClick={() => router.push(routes.customers.edit(customer.id))}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[520px]">
          <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="accounting">Cari Özet</TabsTrigger>
          <TabsTrigger value="transactions">Cari Hareketler</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">İletişim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phoneNumber || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {customer.city}
                    {customer.district ? ` / ${customer.district}` : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Firma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.club || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.sportsSchoolOfficial || "-"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cari Durum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xl font-semibold">{formatCurrency(taxExcludedSummary.balance)}</p>
                {getBalanceBadge(taxExcludedSummary.balance)}
                <GrossAmountText label="Brüt/Yasal bakiye" value={summary.balance} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adres</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {customer.address || "Adres bilgisi girilmemiş"}
              </p>
            </CardContent>
          </Card>

          <CustomerNotes customer={customer} onNotesUpdate={loadData} />
        </TabsContent>

        <TabsContent value="accounting" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Borç KDV Hariç</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(taxExcludedSummary.totalDebit)}</p>
                    <GrossAmountText label="Brüt/Yasal borç" value={summary.totalDebit} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Alacak KDV Hariç</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(taxExcludedSummary.totalCredit)}</p>
                    <GrossAmountText label="Brüt/Yasal alacak" value={summary.totalCredit} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Bakiye KDV Hariç</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-bold">{formatCurrency(taxExcludedSummary.balance)}</p>
                      {getBalanceBadge(taxExcludedSummary.balance)}
                    </div>
                    <GrossAmountText label="Brüt/Yasal bakiye" value={summary.balance} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Cari Hareketler</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={recentTransactions} emptyText="Henüz cari hareket yok" />
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => handleTabChange("transactions")}>
            <FileText className="mr-2 h-4 w-4" />
            Tüm Cari Hareketler
          </Button>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cari Hareketler</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={accounting.transactions} emptyText="İşlem bulunamadı" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
