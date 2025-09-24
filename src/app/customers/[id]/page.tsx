"use client"

import { useRouter, useParams } from "next/navigation"
import { CustomerDetail } from "@/components/customer-detail"

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()

  const handleEdit = () => {
    router.push(`/customers/${params.id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">
            Müşteri Detayları
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Müşteri bilgilerini görüntüleyin ve yönetin
          </p>
        </div>

        <CustomerDetail 
          customerId={params.id as string}
          onEdit={handleEdit}
        />
      </div>
    </div>
  )
}