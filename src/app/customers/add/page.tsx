"use client"

import { useRouter } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"
import { BackButton } from "@/components/back-button"
import { toast } from "sonner"
import { routes } from "@/lib/routes"

export default function AddCustomerPage() {
  const router = useRouter()

  const handleSuccess = () => {
    toast.success("Müşteri başarıyla oluşturuldu!")
    router.push(routes.customers.list)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <BackButton size="sm" fallbackHref={routes.customers.list} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Yeni Müşteri Ekle
            </h1>
            <p className="text-muted-foreground">
              Yeni müşteri bilgilerini girin
            </p>
          </div>
        </div>
      </div>

      <CustomerForm 
        embedded
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
