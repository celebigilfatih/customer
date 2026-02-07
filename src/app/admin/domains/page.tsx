"use client"

import { useRouter } from "next/navigation"
import { Plus, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { DomainList } from "@/components/domain-list"
import { PageHeader } from "@/components/page-header"

export default function AdminDomainsPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Yönetimi"
        description="Domain kayıtlarını görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Domainler" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/domains/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Domain
          </Button>
        }
      />
      <DomainList onAdd={() => router.push('/admin/domains/add')} />
    </div>
  )
}
