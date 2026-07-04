"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { routes } from "@/lib/routes"

type InvoiceRow = {
  id: string
  number: string
  status: string
  subtotal: string
  taxAmount: string
  total: string
  issueDate: string
  dueDate: string
  customer?: {
    fullName?: string
  }
  items?: Array<{
    id: string
    description: string
    domain?: { name: string } | null
    hosting?: { name: string } | null
    product?: { name: string; type: string } | null
  }>
  _count?: {
    items?: number
    payments?: number
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  ISSUED: "Kesildi",
  PARTIAL: "Kısmi",
  PAID: "Ödendi",
  CANCELLED: "İptal",
}

const formatMoney = (value: string | number | null | undefined) => {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

const getInvoiceServices = (invoice: InvoiceRow) => {
  const labels =
    invoice.items?.map((item) => {
      if (item.domain) return `Domain: ${item.domain.name}`
      if (item.hosting) return `Hosting: ${item.hosting.name}`
      if (item.product?.type === "SERVICE") return `Hizmet: ${item.product.name}`
      if (item.product?.type === "PRODUCT") return `Ürün: ${item.product.name}`
      return `Kalem: ${item.description}`
    }) || []

  return Array.from(new Set(labels.filter(Boolean)))
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/invoices")
        if (!response.ok) {
          setInvoices([])
          return
        }
        const data = await response.json()
        setInvoices(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturalar"
        description="Kesilmiş ve taslak faturaları görüntüleyin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Faturalar" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Hizmet / Kalem</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>KDV Hariç</TableHead>
                <TableHead>Kesim</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead>Kalem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const services = getInvoiceServices(invoice)

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.customer?.fullName || "-"}</TableCell>
                    <TableCell>
                      {services.length > 0 ? (
                        <div className="space-y-1">
                          {services.map((service) => (
                            <div key={service} className="text-sm">
                              {service}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{statusLabels[invoice.status] || invoice.status}</TableCell>
                    <TableCell>
                      <div className="font-mono font-medium">{formatMoney(invoice.subtotal)}</div>
                      <div className="text-xs text-muted-foreground">Brüt/Yasal: {formatMoney(invoice.total)}</div>
                    </TableCell>
                    <TableCell>{new Date(invoice.issueDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>{invoice._count?.items ?? 0}</TableCell>
                  </TableRow>
                )
              })}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? "Yükleniyor..." : "Fatura kaydı bulunamadı"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
