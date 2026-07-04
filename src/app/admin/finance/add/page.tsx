"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentForm } from "@/components/payment-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

function AdminFinanceAddContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined
  const backHref = customerId ? `${routes.customers.detail(customerId)}?tab=transactions` : routes.admin.finance

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manuel Tahsilat"
        description={
          customerId
            ? "Seçili müşteriden alınan parayı satış oluşturmadan cari hesaba işle"
            : "Satış oluşturmadan alınan para kaydını cari hesaba işle"
        }
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Tahsilatlar", href: "/admin/finance" },
          { label: "Manuel Tahsilat" },
        ]}
      />
      <PaymentForm
        embedded
        manualCollectionOnly
        lockCustomerSelection={Boolean(customerId)}
        initial={customerId ? { customerId } : undefined}
        onCancel={() => router.push(backHref)}
        onSuccess={() => router.push(backHref)}
      />
    </div>
  )
}

export default function AdminFinanceAddPage() {
  return (
    <Suspense fallback={null}>
      <AdminFinanceAddContent />
    </Suspense>
  )
}
