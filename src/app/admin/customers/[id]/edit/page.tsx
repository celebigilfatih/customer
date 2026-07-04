"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Customer } from "@/generated/prisma"
import { CustomerForm } from "@/components/customer-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"
import { toast } from "sonner"

export default function AdminEditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`)
        if (!response.ok) throw new Error("Müşteri bulunamadı")
        setCustomer(await response.json())
      } catch {
        toast.error("Müşteri bulunamadı")
        router.push(routes.customers.list)
      } finally {
        setIsLoading(false)
      }
    }

    if (customerId) loadCustomer()
  }, [customerId, router])

  if (isLoading) {
    return <div className="py-24 text-center text-muted-foreground">Müşteri bilgileri yükleniyor...</div>
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşteri Düzenle"
        description={customer.fullName}
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Müşteriler", href: routes.customers.list },
          { label: customer.fullName, href: routes.customers.detail(customer.id) },
          { label: "Düzenle" },
        ]}
      />

      <CustomerForm
        embedded
        customer={customer}
        onSuccess={() => router.push(routes.customers.detail(customer.id))}
        onCancel={() => router.push(routes.customers.detail(customer.id))}
      />
    </div>
  )
}
