"use client"

import { DirectSaleForm } from "@/components/direct-sale-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function NewDirectSalePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Direkt Satış"
        description="Müşteri, kalem ve tahsilat bilgileriyle satışı tamamlayın"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Direkt Satış" },
        ]}
      />
      <DirectSaleForm />
    </div>
  )
}
