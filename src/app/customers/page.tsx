"use client"

import { useRouter } from "next/navigation"
import { CustomerList } from "@/components/customer-list"
import { CustomerListItem } from "@/lib/types"
import { routes } from "@/lib/routes"

export default function CustomersPage() {
  const router = useRouter()

  const handleAddCustomer = () => {
    router.push(routes.customers.add)
  }

  const handleEditCustomer = (customer: CustomerListItem) => {
    router.push(routes.customers.edit(customer.id))
  }

  const handleViewCustomer = (customer: CustomerListItem) => {
    router.push(routes.customers.detail(customer.id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
        </div>

        <CustomerList
          onAddCustomer={handleAddCustomer}
          onEditCustomer={handleEditCustomer}
          onViewCustomer={handleViewCustomer}
        />
      </div>
    </div>
  )
}
