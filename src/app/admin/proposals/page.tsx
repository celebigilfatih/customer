"use client"

import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProposalList } from "@/components/proposal-list"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"
import { useRouter } from "next/navigation"

export default function AdminProposalsPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklif Yönetimi"
        description="Müşteri tekliflerini görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Teklifler" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/proposals/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Teklif
          </Button>
        }
      />
      <ProposalList />
    </div>
  )
}
