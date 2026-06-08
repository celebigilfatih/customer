"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerList } from "@/components/customer-list"
import { CustomerListItem } from "@/lib/types"
import { routes } from "@/lib/routes"
import { PageHeader } from "@/components/page-header"

export default function AdminCustomersPage() {
  const router = useRouter()

  const handleAddCustomer = () => router.push(routes.customers.add)
  const handleEditCustomer = (c: CustomerListItem) => router.push(routes.customers.edit(c.id))
  const handleViewCustomer = (c: CustomerListItem) => router.push(routes.customers.detail(c.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Listesi"
        description="Tüm müşterilerinizi görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Müşteriler" },
        ]}
        actions={
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        }
      />
      <CustomerList
        onAddCustomer={handleAddCustomer}
        onEditCustomer={handleEditCustomer}
        onViewCustomer={handleViewCustomer}
      />
    </div>
  )
}
