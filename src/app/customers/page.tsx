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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Müşteriler</h1>
      </div>

      <CustomerList
        onAddCustomer={handleAddCustomer}
        onEditCustomer={handleEditCustomer}
        onViewCustomer={handleViewCustomer}
      />
    </div>
  )
}
