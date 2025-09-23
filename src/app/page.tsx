"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CustomerList } from "@/components/customer-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerListItem } from "@/lib/types"
import { Plus, LogOut, Users } from "lucide-react"

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

  const handleLogout = () => {
    // Clear authentication cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Müşteri Takip Sistemi</h1>
              <p className="text-gray-600 mt-1">
                Müşterilerinizi yönetin ve bilgilerini etkili bir şekilde takip edin
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/users')} size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Users className="w-5 h-5 mr-2" />
                Kullanıcılar
              </Button>
              <Button onClick={handleAddCustomer} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Müşteri Ekle
              </Button>
              <Button onClick={handleLogout} size="lg" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>

     
            <CustomerList
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onViewCustomer={handleViewCustomer}
              refreshTrigger={refreshTrigger}
            />
      </div>
    </div>
  )
}
