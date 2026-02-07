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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 items-center mb-4">
            <BackButton size="sm" fallbackHref={routes.customers.list} className="hover:bg-gray-100" />
            <div className="col-span-3">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
                Yeni Müşteri Ekle
              </h1>
              <p className="text-muted-foreground text-lg">
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
    </div>
  )
}
