"use client"

import { useRouter } from "next/navigation"
import { PaymentForm } from "@/components/payment-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function AdminFinanceAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-5">
      <PageHeader
        title="Manuel Tahsilat"
        description="Satış oluşturmadan alınan para kaydını cari hesaba işle"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Tahsilatlar", href: "/admin/finance" },
          { label: "Manuel Tahsilat" },
        ]}
      />
      <PaymentForm
        embedded
        manualCollectionOnly
        onCancel={() => router.push('/admin/finance')}
        onSuccess={() => router.push('/admin/finance')}
      />
    </div>
  )
}
