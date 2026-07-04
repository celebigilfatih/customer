"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { paymentCreateSchema, type PaymentCreate } from "@/lib/validations"
import { toast } from "sonner"

type SimpleCustomer = { id: string; fullName: string }
type SimpleSubscription = { id: string; name: string; period?: 'MONTHLY'|'YEARLY'; startDate?: string; endDate?: string; price?: string }

interface PaymentFormProps {
  onSubmit?: (data: PaymentCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
  initial?: Partial<PaymentCreate>
}

export function PaymentForm({ onSubmit, onSuccess, onCancel, embedded = false, initial }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [subscriptions, setSubscriptions] = useState<SimpleSubscription[]>([])
  const [subscriptionDebt, setSubscriptionDebt] = useState<string>("")
  const toYmd = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const form = useForm({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: {
      customerId: initial?.customerId ?? "",
      subscriptionId: initial?.subscriptionId ?? undefined,
      amount: initial?.amount ?? "",
      currency: initial?.currency ?? "TRY",
      dueDate: initial?.dueDate ?? "",
      paidDate: initial?.paidDate ?? undefined,
      status: initial?.status ?? "DUE",
      note: initial?.note ?? undefined,
    } as PaymentCreate,
  })

  useEffect(() => {
    const today = new Date()
    if (!form.getValues('dueDate')) {
      form.setValue('dueDate', toYmd(today))
    }
  }, [form])

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

  const loadSubscriptions = async (customerId: string) => {
    try {
      if (!customerId) {
        setSubscriptions([])
        return
      }
      const res = await fetch(`/api/subscriptions?customerId=${encodeURIComponent(customerId)}&limit=100`)
      if (!res.ok) return
      const data = await res.json()
      const items = (data.data || []).map((s: { id: string; name: string; period: 'MONTHLY'|'YEARLY'; startDate: string; endDate: string; price: string }) => ({ id: s.id, name: s.name, period: s.period, startDate: s.startDate, endDate: s.endDate, price: s.price }))
      setSubscriptions(items)
    } catch {}
  }

  const computeSubscriptionDebt = async (customerId: string, subscriptionId: string) => {
    try {
      const res = await fetch(`/api/payments?customerId=${encodeURIComponent(customerId)}&subscriptionId=${encodeURIComponent(subscriptionId)}&limit=100`)
      if (!res.ok) return
      const data = await res.json()
      const items: { amount: string; status: 'DUE'|'LATE'|'PAID'; subscriptionId?: string }[] = data.data || []
      const debt = items
        .filter((p) => (p.status === 'DUE' || p.status === 'LATE'))
        .reduce((sum, p) => sum + (parseInt(p.amount || '0', 10) || 0), 0)
      setSubscriptionDebt(debt > 0 ? String(debt) : '')
    } catch {}
  }

  const handleSubmit = async (data: PaymentCreate) => {
    setIsLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        const response = await fetch(`/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
      }
      toast.success("Ödeme başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error("Ödeme kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  // ensure initial values populate subscriptions and debt when editing
  useEffect(() => {
    const cid = form.getValues('customerId')
    if (cid) {
      loadSubscriptions(cid)
    }
    const sid = form.getValues('subscriptionId')
    if (cid && sid) {
      computeSubscriptionDebt(cid, sid)
    }
  }, [form])

  return (
    <Card className={embedded ? "border" : "w-full max-w-2xl mx-auto"}>
      {embedded ? null : (
        <CardHeader>
          <CardTitle>Yeni Ödeme</CardTitle>
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
                    <Select onValueChange={(v) => { field.onChange(v); loadSubscriptions(v) }} defaultValue={field.value || undefined}>
                      <SelectTrigger>
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
                name="subscriptionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abonelik (opsiyonel)</FormLabel>
                    <Select onValueChange={(v) => {
                      field.onChange(v)
                      const sub = subscriptions.find((s) => s.id === v)
                      if (sub) {
                        if (sub.price) form.setValue('amount', sub.price)
                        if (sub.period === 'MONTHLY' && sub.startDate) {
                          const start = new Date(sub.startDate)
                          const today = new Date()
                          const desiredDay = start.getDate()
                          const candidate = new Date(today.getFullYear(), today.getMonth(), desiredDay)
                          if (candidate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                            candidate.setMonth(candidate.getMonth() + 1)
                          }
                          form.setValue('dueDate', toYmd(candidate))
                        } else if (sub.period === 'YEARLY') {
                          const due = sub.endDate ? new Date(sub.endDate) : (sub.startDate ? new Date(new Date(sub.startDate).setFullYear(new Date(sub.startDate).getFullYear() + 1)) : new Date())
                          form.setValue('dueDate', toYmd(due))
                        }
                        const customerId = form.getValues('customerId')
                        if (customerId) {
                          computeSubscriptionDebt(customerId, sub.id)
                        }
                      }
                    }} defaultValue={(field.value as string | undefined) || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Abonelik seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {subscriptionDebt !== '' ? (
                      <div className="text-xs text-muted-foreground mt-1">Borç Bilgisi: {subscriptionDebt} TL</div>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Tutarı (TL)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Örn: 1500"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="pr-12"
                          {...field}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">TL</span>
                      </div>
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
                    <FormControl>
                      <Input placeholder="TRY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vade</FormLabel>
                    <FormControl>
                      <Input type="date" aria-required="true" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödendi (opsiyonel)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Durum</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DUE">Ödenecek</SelectItem>
                        <SelectItem value="LATE">Gecikmiş</SelectItem>
                        <SelectItem value="PAID">Ödendi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Not (opsiyonel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Açıklama" {...field} />
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
