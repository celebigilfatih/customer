"use client"

import { ProposalForm } from "@/components/proposal-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"
import { useRouter } from "next/navigation"

export default function AddProposalPage() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <PageHeader
        className="gap-3"
        title="Yeni Teklif"
        description="Müşteri, katalog kalemleri ve geçerlilik bilgileriyle teklif oluşturun"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Teklifler", href: routes.admin.proposals },
          { label: "Yeni Teklif" },
        ]}
      />
      <ProposalForm
        embedded
        onSuccess={() => router.push("/admin/proposals")} 
        onCancel={() => router.push("/admin/proposals")} 
      />
    </div>
  )
}
