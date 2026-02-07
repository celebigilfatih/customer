"use client"

import { useParams } from "next/navigation"
import { ProposalDetail } from "@/components/proposal-detail"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"
import { FileText } from "lucide-react"

export default function AdminProposalDetailPage() {
  const params = useParams()
  const proposalId = params.id as string

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklif Detayı"
        description="Teklif bilgilerini görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Teklifler", href: '/admin/proposals' },
          { label: "Detay" },
        ]}
      />
      <ProposalDetail proposalId={proposalId} />
    </div>
  )
}
