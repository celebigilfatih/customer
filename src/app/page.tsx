"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CustomerList } from "@/components/customer-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerListItem } from "@/lib/types"
import { Plus } from "lucide-react"

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  const handleAddCustomer = () => {
    router.push('/customers/add')
  }

  const handleEditCustomer = (customer: CustomerListItem) => {
    router.push(`/customers/${customer.id}/edit`)
  }

  const handleViewCustomer = (customer: CustomerListItem) => {
    router.push(`/customers/${customer.id}`)
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">Müşteri Takip Sistemi</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Müşterilerinizi yönetin ve bilgilerini etkili bir şekilde takip edin
              </p>
            </div>
            <Button onClick={handleAddCustomer} size="lg" className="shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Müşteri Ekle
            </Button>
          </div>
        </div>

        <Card className="card-shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <CustomerList
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onViewCustomer={handleViewCustomer}
              refreshTrigger={refreshTrigger}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
