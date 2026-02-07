"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { proposalUpdateSchema, type ProposalUpdate } from "@/lib/validations"
import { toast } from "sonner"
import { getProposalTypes } from "@/lib/settings-client"

type ProposalType = {
  id: string
  name: string
  label: string
  isActive: boolean
}

type ProposalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

interface ProposalEditFormProps {
  proposalId: string
  initialData: {
    title: string
    type: string
    description?: string
    amount: string
    currency: string
    validUntil: string
    status: ProposalStatus
    notes?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProposalEditForm({ proposalId, initialData, onSuccess, onCancel }: ProposalEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [proposalTypes, setProposalTypes] = useState<ProposalType[]>([])
  const [typesLoading, setTypesLoading] = useState(true)

  const form = useForm<ProposalUpdate>({
    resolver: zodResolver(proposalUpdateSchema),
    defaultValues: {
      title: initialData.title,
      type: initialData.type,
      description: initialData.description || "",
      amount: initialData.amount,
      currency: initialData.currency,
      validUntil: initialData.validUntil,
      notes: initialData.notes || "",
    },
  })

  useEffect(() => {
    const loadProposalTypes = async () => {
      try {
        const types = await getProposalTypes()
        setProposalTypes(types.filter(t => t.isActive))
      } catch (error) {
        console.error("Failed to load proposal types:", error)
      } finally {
        setTypesLoading(false)
      }
    }

    loadProposalTypes()
  }, [])

  const handleSubmit = async (data: ProposalUpdate) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Güncelleme başarısız")
      
      toast.success("Teklif başarıyla güncellendi")
      onSuccess?.()
    } catch {
      toast.error("Teklif güncellenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) throw new Error("Durum güncelleme başarısız")
      
      toast.success(`Teklif durumu güncellendi: ${getStatusLabel(newStatus)}`)
      onSuccess?.()
    } catch {
      toast.error("Durum güncellenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: ProposalStatus) => {
    const labels: Record<ProposalStatus, string> = {
      DRAFT: "Taslak",
      PENDING: "Beklemede",
      APPROVED: "Onaylandı",
      REJECTED: "Reddedildi",
      EXPIRED: "Süresi Doldu",
    }
    return labels[status]
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teklif Düzenle</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Status Section */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h3 className="font-medium">Teklif Durumu</h3>
              <div className="flex flex-wrap gap-2">
                {(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as ProposalStatus[]).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={initialData.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    disabled={isLoading}
                  >
                    {getStatusLabel(status)}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Mevcut durum: <strong>{getStatusLabel(initialData.status)}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık *</FormLabel>
                    <FormControl>
                      <Input placeholder="Teklif başlığı..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teklif Türü</FormLabel>
                    {typesLoading ? (
                      <div className="text-muted-foreground text-sm">Yükleniyor...</div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {proposalTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Teklif açıklaması..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tutar *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Birimi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Para birimi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                        <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geçerlilik Tarihi *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Textarea placeholder="Ek notlar..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
