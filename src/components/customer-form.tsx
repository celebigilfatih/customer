"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { customerCreateSchema, CustomerCreate } from "@/lib/validations"
import { Customer } from "@/generated/prisma"
import { toast } from "sonner"
import { getCities } from "@/lib/cities"

interface CustomerFormProps {
  customer?: Customer
  onSubmit?: (data: CustomerCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
}

export function CustomerForm({ customer, onSubmit, onSuccess, onCancel, embedded = false }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<{id: number, name: string}[]>([])
  
  const form = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: customer ? {
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      city: customer.city,
      district: customer.district,
      club: customer.club,
      sportsSchoolOfficial: customer.sportsSchoolOfficial,
      address: customer.address,
    } : {
      fullName: "",
      phoneNumber: "",
      city: "",
      district: "",
      club: "",
      sportsSchoolOfficial: "",
      address: "",
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
        const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
        const method = customer ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        
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
    <Card className={embedded ? "border" : "w-full max-w-2xl mx-auto"}>
      {embedded ? null : (
        <CardHeader>
          <CardTitle>
            {customer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-4" : undefined}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="İl seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
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
                    <FormLabel className="text-gray-700 font-medium">Firma</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Firma adını girin"
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
                    <FormLabel className="text-gray-700 font-medium">Yetkili</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Yetkili adını girin"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Adres</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tam adresi girin"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="flex gap-4 pt-6 border-t border-border">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Kaydediliyor..." : customer ? "Müşteriyi Güncelle" : "Müşteri Oluştur"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
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
