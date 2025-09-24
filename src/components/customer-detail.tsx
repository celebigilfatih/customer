"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerWithNotes } from "@/lib/types"
import { CustomerNotes } from "@/components/customer-notes"
import { Edit, Phone, MapPin, Building } from "lucide-react"
import { toast } from "sonner"
import { apiGet } from "@/lib/api"

interface CustomerDetailProps {
  customerId: string
  onEdit: () => void
}

export function CustomerDetail({ customerId, onEdit }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerWithNotes | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/customers/${customerId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customer')
      }
      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Müşteri bilgileri alınırken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchCustomer()
  }, [customerId, fetchCustomer])

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
      case 'SOLD': return 'bg-emerald-100 text-emerald-800'
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
      case 'SOLD': return 'Satıldı'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Düzenle
        </Button>
      </div>

      {/* Customer Information */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold flex items-center justify-between text-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{customer.fullName.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{customer.fullName}</h2>
                <p className="text-sm text-gray-500 font-normal">Müşteri Detayları</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
              {getStatusText(customer.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* İletişim Bilgileri */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">İletişim Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium text-gray-900 ml-auto">{customer.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Şehir:</span>
                    <span className="font-medium text-gray-900 ml-auto">{customer.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">İlçe:</span>
                    <span className="font-medium text-gray-900 ml-auto">{customer.district}</span>
                  </div>
                  {customer.price && (
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 text-green-600">₺</span>
                      <span className="text-gray-600">Fiyat:</span>
                      <span className="font-medium text-gray-900 ml-auto">{Number(customer.price).toLocaleString('tr-TR')} ₺</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Kulüp Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kulüp:</span>
                    <span className="font-medium text-gray-900">{customer.club}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yetkili:</span>
                    <span className="font-medium text-gray-900">{customer.sportsSchoolOfficial}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarih ve Teklif Bilgileri */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Tarih Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Başlangıç:</span>
                    <span className="font-medium text-gray-900">{customer.startDate ? new Date(customer.startDate).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bitiş:</span>
                    <span className="font-medium text-gray-900">{customer.endDate ? new Date(customer.endDate).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Süre:</span>
                    <span className="font-medium text-gray-900">{customer.duration} Yıl</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Teklif Bilgileri</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-800 leading-relaxed">{customer.offer}</p>
                </div>
              </div>
            </div>

            {/* Adres ve Ek Bilgiler */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Adres</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-800 leading-relaxed">{customer.address}</p>
                </div>
              </div>
              
              {customer.hosting && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Hosting</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-800">{customer.hosting}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <CustomerNotes customer={customer} onNotesUpdate={handleNotesUpdate} />
    </div>
  )
}