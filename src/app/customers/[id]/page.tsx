"use client"

import { useRouter, useParams } from "next/navigation"
import { CustomerDetail } from "@/components/customer-detail"
import { routes } from "@/lib/routes"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft } from "lucide-react"

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()

  const handleEdit = () => {
    router.push(routes.customers.edit(params.id as string))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Detayları"
        description="Müşteri bilgilerini görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Müşteriler", href: routes.customers.list },
          { label: "Detay" },
        ]}
        actions={
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Button>
        }
      />

      <CustomerDetail 
        customerId={params.id as string}
        onEdit={handleEdit}
      />
    </div>
  )
}
