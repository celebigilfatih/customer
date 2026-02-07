"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { CustomerWithNotes } from "@/lib/types"
import { CustomerNotes } from "@/components/customer-notes"
import { 
  Edit, 
  Phone, 
  MapPin, 
  Building, 
  User, 
  Mail, 
  Calendar, 
  FileText,
  Briefcase,
  MapPinned,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface CustomerDetailProps {
  customerId: string
  onEdit: () => void
}

export function CustomerDetail({ customerId, onEdit }: CustomerDetailProps) {
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
    const fetchCustomerData = async () => {
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
    
    fetchCustomerData()
  }, [customerId])

  const handleNotesUpdate = () => {
    fetchCustomer() // Refresh customer data when notes are updated
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">Müşteri bulunamadı</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-3xl">{customer.fullName.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{customer.fullName}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Briefcase className="h-4 w-4" />
                {customer.club || "Firma bilgisi yok"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {customer.city}
                </Badge>
                {customer.district && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {customer.district}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                <CardDescription>Müşteri iletişim detayları</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Telefon</span>
              </div>
              <span className="font-medium">{customer.phoneNumber || "-"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPinned className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Şehir / İlçe</span>
              </div>
              <span className="font-medium">{customer.city} {customer.district && `/ ${customer.district}`}</span>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Firma Bilgileri</CardTitle>
                <CardDescription>Firma ve yetkili bilgileri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Firma</span>
              </div>
              <span className="font-medium">{customer.club || "-"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Yetkili</span>
              </div>
              <span className="font-medium">{customer.sportsSchoolOfficial || "-"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Adres</CardTitle>
                <CardDescription>Müşteri adres bilgisi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              {customer.address ? (
                <p className="text-sm leading-relaxed">{customer.address}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Adres bilgisi girilmemiş</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <CustomerNotes customer={customer} onNotesUpdate={handleNotesUpdate} />
    </div>
  )
}
