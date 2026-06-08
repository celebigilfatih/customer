"use client"

import { useRouter } from "next/navigation"
import { Plus, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { HostingList } from "@/components/hosting-list"
import { PageHeader } from "@/components/page-header"

export default function AdminHostingPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hosting Yönetimi"
        description="Hosting paketlerini görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Hostingler" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/hosting/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hosting
          </Button>
        }
      />
      <HostingList onAdd={() => router.push('/admin/hosting/add')} />
    </div>
  )
}
