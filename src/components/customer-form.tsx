"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Customer, CustomerStatus } from "@/generated/prisma"
import { customerCreateSchema, type CustomerCreate } from "@/lib/validations"
import { getCities } from "@/lib/cities"
import { toast } from "sonner"
import { apiPost, apiPut } from "@/lib/api"

interface CustomerFormProps {
  customer?: Customer
  onSubmit?: (data: CustomerCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSubmit, onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  
  const form = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: customer ? {
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      city: customer.city,
      district: customer.district,
      club: customer.club,
      sportsSchoolOfficial: customer.sportsSchoolOfficial,
      hosting: customer.hosting,
      duration: customer.duration,
      startDate: customer.startDate,
      endDate: customer.endDate,
      offer: customer.offer,
      address: customer.address,
      status: customer.status,
      price: customer.price || "",
    } : {
      fullName: "",
      phoneNumber: "",
      city: "",
      district: "",
      club: "",
      sportsSchoolOfficial: "",
      hosting: "",
      duration: "",
      startDate: "",
      endDate: "",
      offer: "",
      address: "",
      status: "POTENTIAL",
      price: "",
    },
  })

  // Load cities on component mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cityList = await getCities()
        setCities(cityList)
      } catch (error) {
        console.error('Failed to load cities:', error)
        toast.error("İl listesi yüklenemedi")
      }
    }
    loadCities()
  }, [])

  const handleSubmit = async (data: CustomerCreate) => {
    setIsLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Default API call if no onSubmit provided
        const response = customer 
          ? await apiPut(`/api/customers/${customer.id}`, data)
          : await apiPost('/api/customers', data)
        
        if (!response.ok) {
          throw new Error('Failed to save customer')
        }
      }
      
      toast.success(customer ? "Müşteri başarıyla güncellendi!" : "Müşteri başarıyla oluşturuldu!")
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error("Müşteri kaydedilemedi. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto card-shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="text-2xl font-semibold text-gray-800">
          {customer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Ad Soyad</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ad ve soyadı girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Telefon Numarası</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Telefon numarasını girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">İl</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="İl seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 bg-white">
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">İlçe</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="İlçe girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Kulüp</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Kulüp adını girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sportsSchoolOfficial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Spor Okulu Yetkilisi</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Yetkili adını girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hosting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Hosting</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Hosting bilgisi girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Süre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Süre seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="1">1 Yıl</SelectItem>
                        <SelectItem value="2">2 Yıl</SelectItem>
                        <SelectItem value="3">3 Yıl</SelectItem>
                        <SelectItem value="4">4 Yıl</SelectItem>
                        <SelectItem value="5">5 Yıl</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Başlangıç Tarihi</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Bitiş Tarihi</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="offer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Teklif</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Teklif detaylarını girin" 
                      className="min-h-[100px] border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Adres</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tam adresi girin" 
                      className="min-h-[80px] border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Fiyat (TL)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Fiyatı girin" 
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Durum</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="POTENTIAL">Potansiyel</SelectItem>
                        <SelectItem value="CONTACTED">İletişime Geçildi</SelectItem>
                        <SelectItem value="INTERESTED">İlgili</SelectItem>
                        <SelectItem value="CONVERTED">Dönüştürüldü</SelectItem>
                        <SelectItem value="REJECTED">Reddedildi</SelectItem>
                        <SelectItem value="SOLD">Satıldı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-100">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Kaydediliyor..." : customer ? "Müşteriyi Güncelle" : "Müşteri Oluştur"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 border-gray-200 hover:bg-gray-50"
              >
                İptal
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}