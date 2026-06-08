"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { hostingCreateSchema, type HostingCreate } from "@/lib/validations"
import { toast } from "sonner"

type SimpleCustomer = { id: string; fullName: string; club?: string }

interface HostingFormProps {
  onSubmit?: (data: HostingCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
}

export function HostingForm({ onSubmit, onSuccess, onCancel, embedded = false }: HostingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])

  const form = useForm({
    resolver: zodResolver(hostingCreateSchema),
    defaultValues: {
      customerId: "",
      name: "",
      endDate: "",
      notes: undefined,
    } as HostingCreate,
  })

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers?limit=100`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.data || []).map((c: any) => ({ id: c.id, fullName: c.fullName, club: c.club }))
        setCustomers(items)
      } catch {}
    }
    loadCustomers()
  }, [])

  const handleSubmit = async (data: HostingCreate) => {
    setIsLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        const response = await fetch(`/api/hosting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
      }
      toast.success("Hosting başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error("Hosting kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={embedded ? "border" : "w-full max-w-2xl mx-auto"}>
      {embedded ? null : (
        <CardHeader>
          <CardTitle>Yeni Hosting</CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-4" : undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.club || c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alan Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
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
                    <FormLabel>Bitiş Tarihi</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Input placeholder="Opsiyonel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
