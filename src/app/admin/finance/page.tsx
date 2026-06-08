"use client"

import { useRouter } from "next/navigation"
import { Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { PaymentList } from "@/components/payment-list"
import { PageHeader } from "@/components/page-header"

export default function AdminFinancePage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finans Yönetimi"
        description="Ödemeleri ve finansal işlemleri yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Finans" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/finance/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ödeme
          </Button>
        }
      />
      <PaymentList onAdd={() => router.push('/admin/finance/add')} />
    </div>
  )
}
