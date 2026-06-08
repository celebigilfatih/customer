"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { CustomerForm } from "@/components/customer-form"
import { BackButton } from "@/components/back-button"
import { toast } from "sonner"
import { Customer } from "@/generated/prisma"
import { routes } from "@/lib/routes"

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${params.id}`)
        if (!response.ok) {
          throw new Error('Müşteri bulunamadı')
        }
        const data = await response.json()
        setCustomer(data)
      } catch (error) {
        console.error('Müşteri getirme hatası:', error)
        toast.error("Müşteri bulunamadı")
        router.push(routes.customers.list)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchCustomer()
    }
  }, [params.id, router])

  const handleSuccess = () => {
    toast.success("Müşteri başarıyla güncellendi!")
    router.push(routes.customers.list)
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Müşteri bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 items-center mb-4">
            <BackButton size="sm" fallbackHref={routes.customers.list} className="hover:bg-gray-100" />
            <div className="col-span-3">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
                Müşteri Düzenle
              </h1>
              <p className="text-muted-foreground text-lg">
                Müşteri bilgilerini güncelleyin
              </p>
            </div>
          </div>
        </div>

        <CustomerForm 
          embedded
          customer={customer}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
