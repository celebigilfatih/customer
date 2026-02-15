"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { subscriptionCreateSchema, type SubscriptionCreate } from "@/lib/validations"
import { toast } from "sonner"
import { getProposalTypes } from "@/lib/settings-client"

type SimpleCustomer = { id: string; fullName: string }

interface SubscriptionFormProps {
  onSubmit?: (data: SubscriptionCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
  initial?: Partial<SubscriptionCreate>
}

export function SubscriptionForm({ onSubmit, onSuccess, onCancel, embedded = false, initial }: SubscriptionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [proposalTypes, setProposalTypes] = useState<{ id: string; name: string; label: string; isActive: boolean }[]>([])
  const [installmentCount, setInstallmentCount] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDueDate, setPaymentDueDate] = useState("")
  const [yearlyPlan, setYearlyPlan] = useState<'single' | 'installments'>('single')
  const typeNameMap: Record<string, string> = {
    ...Object.fromEntries(proposalTypes.map(t => [t.name, t.label])),
    SOFTWARE_RENTAL: 'Yazılım Kiralama',
    CUSTOM_PROJECT: 'Özel Proje',
    MAINTENANCE: 'Bakım Anlaşması',
    NEXT_GEN_COACHING: 'Next Gen Coaching',
    AIDAT_TAKIP: 'Aidat Takip',
    FOOTBALL_CMS: 'Football Cms',
    DOMAIN: 'Domain',
    HOSTING: 'Hosting',
  }

  const form = useForm({
    resolver: zodResolver(subscriptionCreateSchema),
    defaultValues: {
      customerId: "",
      name: undefined,
      types: proposalTypes.length > 0 ? [proposalTypes[0].name] : ["SOFTWARE_RENTAL"],
      period: "MONTHLY",
      startDate: "",
      endDate: "",
      autoRenew: false,
      status: "ACTIVE",
      price: "",
      proposalType: "",
    ...(initial || {}),
    } as SubscriptionCreate,
  })

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch(`/api/customers?limit=100`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.data || []).map((c: { id: string; fullName: string }) => ({ id: c.id, fullName: c.fullName }))
        setCustomers(items)
      } catch {}
    }
    loadCustomers()
  }, [])

  useEffect(() => {
    const loadProposalTypes = async () => {
      try {
        const types = await getProposalTypes()
        setProposalTypes(types.filter(t => t.isActive))
      } catch (error) {
        console.error("Failed to load proposal types:", error)
      }
    }

    loadProposalTypes()
  }, [])

  useEffect(() => {
    const toYmd = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const today = new Date()
    const nextYear = new Date(today)
    nextYear.setFullYear(today.getFullYear() + 1)
    if (!form.getValues('startDate')) form.setValue('startDate', toYmd(today))
    if (!form.getValues('endDate')) form.setValue('endDate', toYmd(nextYear))
  }, [form])

  const periodWatch = form.watch('period')

  const handleSubmit = async (data: SubscriptionCreate) => {
    setIsLoading(true)
    try {
      const t = data.types?.[0]
      const autoName = t ? `Abonelik - ${typeNameMap[t] || t}` : 'Abonelik'
      data.name = data.name && data.name.length >= 2 ? data.name : autoName
      if (periodWatch === 'MONTHLY' && installmentCount) {
        const count = parseInt(installmentCount, 10)
        if (count > 0) {
          data.installmentCount = count as unknown as SubscriptionCreate['installmentCount']
        }
      }
      if (onSubmit) {
        await onSubmit(data)
      } else {
        const response = await fetch(`/api/subscriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
        const created = await response.json()

        // Update proposal type separately if provided
        if (data.proposalType) {
          await fetch(`/api/subscriptions/${created.id}/proposal-type`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposalType: data.proposalType }),
          })
        }

        if (data.period === 'YEARLY') {
          if (yearlyPlan === 'single' && paymentAmount && paymentDueDate) {
            await fetch(`/api/payments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerId: data.customerId,
                subscriptionId: created.id,
                amount: paymentAmount,
                currency: 'TRY',
                dueDate: paymentDueDate,
              }),
            })
          }
          if (yearlyPlan === 'installments') {
            const annual = parseInt(data.price, 10)
            const base = Math.floor(annual / 12)
            const rem = annual % 12
            const start = new Date(data.startDate)
            const requests = Array.from({ length: 12 }, (_, i) => {
              const due = new Date(start)
              due.setMonth(due.getMonth() + i)
              const y = due.getFullYear()
              const m = String(due.getMonth() + 1).padStart(2, '0')
              const d = String(due.getDate()).padStart(2, '0')
              const dueStr = `${y}-${m}-${d}`
              const amt = String(base + (i < rem ? 1 : 0))
              return fetch(`/api/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: data.customerId,
                  subscriptionId: created.id,
                  amount: amt,
                  currency: 'TRY',
                  dueDate: dueStr,
                }),
              })
            })
            await Promise.all(requests)
            data.installmentCount = 12 as unknown as SubscriptionCreate['installmentCount']
          }
        }
        if (data.period === 'MONTHLY' && installmentCount) {
          const count = parseInt(installmentCount, 10)
          if (count > 0) {
            const start = new Date(data.startDate)
            const requests = Array.from({ length: count }, (_, i) => {
              const due = new Date(start)
              due.setMonth(due.getMonth() + i)
              const y = due.getFullYear()
              const m = String(due.getMonth() + 1).padStart(2, '0')
              const d = String(due.getDate()).padStart(2, '0')
              const dueStr = `${y}-${m}-${d}`
              return fetch(`/api/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: data.customerId,
                  subscriptionId: created.id,
                  amount: data.price,
                  currency: 'TRY',
                  dueDate: dueStr,
                }),
              })
            })
            await Promise.all(requests)
          }
        }
      }
      toast.success("Abonelik başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error("Abonelik kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalid = (errors: Record<string, unknown>) => {
    const keys = Object.keys(errors || {})
    if (keys.length > 0) {
      const labelMap: Record<string, string> = {
        customerId: 'Müşteri',
        types: 'Tür',
        period: 'Periyot',
        startDate: 'Başlangıç',
        endDate: 'Bitiş',
        price: 'Tutar',
        name: 'Ad',
      }
      const fields = keys.map(k => labelMap[k] || k).join(', ')
      toast.error(`Lütfen doldurun: ${fields}`)
    } else {
      toast.error("Lütfen zorunlu alanları kontrol edin")
    }
  }

  return (
    <Card className={embedded ? "border" : "w-full max-w-2xl mx-auto"}>
      {embedded ? null : (
        <CardHeader>
          <CardTitle>Yeni Abonelik</CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-4" : undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <SelectTrigger aria-required="true">
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tür</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange([v])}
                      defaultValue={field.value?.[0] || undefined}
                    >
                      <SelectTrigger aria-required="true">
                        <SelectValue placeholder="Tür seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {proposalTypes.filter(t => t.isActive).map((type) => (
                          <SelectItem key={type.id} value={type.name}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periyot</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <SelectTrigger aria-required="true">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Aylık</SelectItem>
                        <SelectItem value="YEARLY">Yıllık</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {periodWatch === 'MONTHLY' && (
                <FormItem>
                  <FormLabel>Vade Sayısı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Örn: 12"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value.replace(/\D/g, ''))}
                    />
                  </FormControl>
                </FormItem>
              )}

              {periodWatch === 'YEARLY' && (
                <>
                  <FormField
                    control={form.control}
                    name="autoRenew"
                    render={() => (
                      <FormItem>
                    <FormLabel>Tekrarlansın</FormLabel>
                    <Select
                      onValueChange={(v) => form.setValue('autoRenew', v === 'true')}
                      defaultValue={String(Boolean(form.getValues('autoRenew')))}
                    >
                      <SelectTrigger aria-required="true">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Evet</SelectItem>
                        <SelectItem value="false">Hayır</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

                  <FormItem>
                    <FormLabel>Ödeme Planı</FormLabel>
                    <Select onValueChange={(v) => setYearlyPlan(v as 'single'|'installments')} defaultValue={yearlyPlan || 'single'}>
                      <SelectTrigger aria-required="true">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Tek Seferlik</SelectItem>
                        <SelectItem value="installments">12 Ay Taksit</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>

                  {yearlyPlan === 'single' && (
                    <FormItem>
                      <FormLabel>Ödeme Tutarı (TL)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Örn: 1500"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="pr-12"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value.replace(/\D/g, ''))}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">TL</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}

                  {yearlyPlan === 'single' && (
                    <FormItem>
                      <FormLabel>Ödeme Vade Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} />
                      </FormControl>
                    </FormItem>
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç</FormLabel>
                    <FormControl>
                      <Input type="date" required {...field} />
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
                    <FormLabel>Bitiş</FormLabel>
                    <FormControl>
                      <Input type="date" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abonelik Tutarı (Periyot)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Örn: 1500"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="pr-12"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">TL</span>
                      </div>
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
