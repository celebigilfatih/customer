"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { SubscriptionList } from "@/components/subscription-list"
import { PageHeader } from "@/components/page-header"

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  return (
    <div className="space-y-4">
      <PageHeader
        className="gap-3"
        title="Abonelik Yönetimi"
        description="Müşteri aboneliklerini görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Abonelikler" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/subscriptions/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Abonelik
          </Button>
        }
      />
      <SubscriptionList onAdd={() => router.push('/admin/subscriptions/add')} />
    </div>
  )
}
