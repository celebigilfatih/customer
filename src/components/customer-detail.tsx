"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerWithNotes } from "@/lib/types"
import { CustomerNotes } from "@/components/customer-notes"
import { ArrowLeft, Edit } from "lucide-react"
import { toast } from "sonner"

interface CustomerDetailProps {
  customerId: string
  onEdit: () => void
  onBack: () => void
}

export function CustomerDetail({ customerId, onEdit, onBack }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerWithNotes | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) {
        throw new Error('Müşteri bilgileri alınamadı')
      }
      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Müşteri bilgileri alınırken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const handleNotesUpdate = () => {
    fetchCustomer() // Refresh customer data when notes are updated
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Müşteri bulunamadı</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POTENTIAL': return 'bg-yellow-100 text-yellow-800'
      case 'CONTACTED': return 'bg-blue-100 text-blue-800'
      case 'INTERESTED': return 'bg-green-100 text-green-800'
      case 'CONVERTED': return 'bg-purple-100 text-purple-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'POTENTIAL': return 'Potansiyel'
      case 'CONTACTED': return 'İletişim Kuruldu'
      case 'INTERESTED': return 'İlgili'
      case 'CONVERTED': return 'Dönüştürüldü'
      case 'REJECTED': return 'Reddedildi'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </Button>
        <Button onClick={onEdit} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Edit className="w-4 h-4 mr-2" />
          Düzenle
        </Button>
      </div>

      {/* Customer Information */}
      <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-xl backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-between">
            <span>👤 {customer.fullName}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
              {getStatusText(customer.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📞 İletişim Bilgileri</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Telefon:</span> {customer.phoneNumber}</p>
                  <p><span className="font-medium">Şehir:</span> {customer.city}</p>
                  <p><span className="font-medium">İlçe:</span> {customer.district}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">🏢 Kulüp Bilgileri</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Kulüp:</span> {customer.club}</p>
                  <p><span className="font-medium">Yetkili:</span> {customer.sportsSchoolOfficial}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📅 Tarih Bilgileri</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Başlangıç:</span> {customer.startDate ? new Date(customer.startDate).toLocaleDateString('tr-TR') : '-'}</p>
                  <p><span className="font-medium">Bitiş:</span> {customer.endDate ? new Date(customer.endDate).toLocaleDateString('tr-TR') : '-'}</p>
                  <p><span className="font-medium">Süre:</span> {customer.duration} Yıl</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">💰 Teklif</h3>
                <p className="bg-gray-50 p-3 rounded-lg">{customer.offer}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">📍 Adres</h3>
            <p className="bg-gray-50 p-3 rounded-lg">{customer.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <CustomerNotes customer={customer} onNotesUpdate={handleNotesUpdate} />
    </div>
  )
}