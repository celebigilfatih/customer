"use client"

import { useRouter } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function AdminAddCustomerPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Müşteri"
        description="Yeni müşteri bilgilerini girin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Müşteriler", href: routes.customers.list },
          { label: "Yeni Müşteri" },
        ]}
      />

      <CustomerForm
        embedded
        onSuccess={() => router.push(routes.customers.list)}
        onCancel={() => router.push(routes.customers.list)}
      />
    </div>
  )
}
