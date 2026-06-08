"use client"

import { ProposalTypeList } from "@/components/proposal-type-list"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function ProposalTypesSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklif Türleri"
        description="Teklif türlerini yönetin ve yeni türler ekleyin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Ayarlar", href: "/admin/settings" },
          { label: "Teklif Türleri" },
        ]}
      />
      <ProposalTypeList />
    </div>
  )
}
