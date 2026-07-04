"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { paymentCreateSchema, type PaymentCreate } from "@/lib/validations"
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  User,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

type SimpleCustomer = { id: string; fullName: string }
type SimpleSubscription = { id: string; name: string; period?: 'MONTHLY'|'YEARLY'; startDate?: string; endDate?: string; price?: string }
type CustomerBalanceSummary = {
  balance: number
  taxExcludedBalance?: number
}

interface PaymentFormProps {
  onSubmit?: (data: PaymentCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
  initial?: Partial<PaymentCreate>
  manualCollectionOnly?: boolean
  lockCustomerSelection?: boolean
}

export function PaymentForm({
  onSubmit,
  onSuccess,
  onCancel,
  embedded = false,
  initial,
  manualCollectionOnly = false,
  lockCustomerSelection = false,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [subscriptions, setSubscriptions] = useState<SimpleSubscription[]>([])
  const [subscriptionDebt, setSubscriptionDebt] = useState<string>("")
  const [customerBalance, setCustomerBalance] = useState<CustomerBalanceSummary | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
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
      subscriptionId: manualCollectionOnly ? undefined : initial?.subscriptionId ?? undefined,
      amount: initial?.amount ?? "",
      currency: initial?.currency ?? "TRY",
      dueDate: initial?.dueDate ?? "",
      paidDate: initial?.paidDate ?? (manualCollectionOnly ? toYmd(new Date()) : undefined),
      status: manualCollectionOnly ? "PAID" : initial?.status ?? "DUE",
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

  const loadCustomerBalance = useCallback(async (customerId: string) => {
    if (!manualCollectionOnly) return
    if (!customerId) {
      setCustomerBalance(null)
      return
    }

    setBalanceLoading(true)
    try {
      const res = await fetch(`/api/accounting/customers/${encodeURIComponent(customerId)}`)
      if (!res.ok) throw new Error("Cari bakiye alınamadı")
      const data = await res.json()
      setCustomerBalance({
        balance: Number(data.summary?.balance || 0),
        taxExcludedBalance: Number(data.summary?.taxExcludedBalance || 0),
      })
    } catch {
      setCustomerBalance(null)
      toast.error("Müşteri cari bakiyesi alınamadı")
    } finally {
      setBalanceLoading(false)
    }
  }, [manualCollectionOnly])

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)

  const toAmountInputValue = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return ""
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "")
  }

  const handleSubmit = async (data: PaymentCreate) => {
    setIsLoading(true)
    try {
      const payload = manualCollectionOnly
        ? {
            ...data,
            subscriptionId: undefined,
            status: "PAID" as const,
            paidDate: data.dueDate,
          }
        : data

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        const response = await fetch(`/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
      }
      toast.success(manualCollectionOnly ? "Manuel tahsilat kaydedildi" : "Ödeme başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error(manualCollectionOnly ? "Manuel tahsilat kaydedilemedi" : "Ödeme kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  // ensure initial values populate subscriptions and debt when editing
  useEffect(() => {
    const cid = form.getValues('customerId')
    if (cid) {
      loadSubscriptions(cid)
      if (manualCollectionOnly) loadCustomerBalance(cid)
    }
    const sid = form.getValues('subscriptionId')
    if (cid && sid) {
      computeSubscriptionDebt(cid, sid)
    }
  }, [form, loadCustomerBalance, manualCollectionOnly])

  const grossBalance = customerBalance?.balance ?? 0
  const taxExcludedBalance = customerBalance?.taxExcludedBalance ?? grossBalance
  const collectibleBalance = Math.max(grossBalance, 0)
  const selectedCustomerId = form.watch("customerId")
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
  const fillCollectibleBalance = () => {
    form.setValue("amount", toAmountInputValue(collectibleBalance), { shouldValidate: true })
  }

  if (embedded && manualCollectionOnly) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <div className="min-w-0">
                <p className="font-medium text-sky-950">Bu ekran sadece alınan parayı kaydeder.</p>
                <p className="mt-1 text-sky-800/80">
                  Satış, fatura, domain veya hosting oluşturmaz; müşteri carisindeki alacağı düşürür.
                </p>
              </div>
            </div>

            <Card className="gap-0 py-0">
              <CardHeader className="border-b p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-sky-700" />
                  <CardTitle className="text-base">Tahsilat Bilgileri</CardTitle>
                </div>
                <CardDescription>Müşteri, tutar ve tahsilat tarihini girin.</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {lockCustomerSelection && selectedCustomerId ? (
                    <div className="md:col-span-2">
                      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <User className="h-3.5 w-3.5 text-sky-700" />
                        Müşteri
                      </div>
                      <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-sky-950">
                            {selectedCustomer?.fullName || "Seçili müşteri"}
                          </p>
                          <p className="mt-0.5 text-xs text-sky-800/80">Müşteri detayından seçildi</p>
                        </div>
                        <User className="h-4 w-4 shrink-0 text-sky-700" />
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-sky-700" />
                            Müşteri
                          </FormLabel>
                          <Select
                            onValueChange={(v) => {
                              field.onChange(v)
                              loadCustomerBalance(v)
                            }}
                            defaultValue={field.value || undefined}
                          >
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
                  )}

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-emerald-700" />
                          Tahsilat Tutarı
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Örn: 1500"
                              inputMode="decimal"
                              pattern="[0-9]+(\.[0-9]{1,2})?"
                              className="h-11 pr-12 text-base font-medium"
                              {...field}
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              TL
                            </span>
                          </div>
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
                        <FormLabel className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-700" />
                          Tahsilat Tarihi
                        </FormLabel>
                        <FormControl>
                          <Input type="date" aria-required="true" className="h-11" {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <CircleDollarSign className="h-3.5 w-3.5 text-amber-700" />
                          Para Birimi
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="TRY" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-600" />
                          Açıklama
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Örn: Banka havalesi, elden tahsilat..."
                            className="min-h-11 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Card className="gap-0 py-0">
              <CardHeader className="border-b p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-red-700" />
                  <CardTitle className="text-base">Cari Özet</CardTitle>
                </div>
                <CardDescription>Tahsilat brüt/yasal cari bakiyeyi düşürür.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {selectedCustomerId ? (
                  <>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                            Tahsil Edilebilir Borç
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-red-700">
                            {balanceLoading ? "Yükleniyor" : formatMoney(collectibleBalance)}
                          </p>
                        </div>
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-red-700">
                          <Wallet className="h-3.5 w-3.5" />
                          <p>Brüt/Yasal</p>
                        </div>
                        <p className="mt-1 font-semibold text-red-700">{formatMoney(grossBalance)}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <CircleDollarSign className="h-3.5 w-3.5" />
                          <p>KDV Hariç</p>
                        </div>
                        <p className="mt-1 font-semibold text-amber-800">{formatMoney(taxExcludedBalance)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={balanceLoading || collectibleBalance <= 0}
                      onClick={fillCollectibleBalance}
                    >
                      Borç Kadar Doldur
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Cari borcu görmek ve tek tıkla doldurmak için müşteri seçin.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 border-emerald-200 bg-emerald-50/50 py-0">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-950">Manuel tahsilat olarak işlenecek</p>
                    <p className="mt-1 text-emerald-800/80">
                      Kayıt, ödeme hareketi ve cari alacak düşümü oluşturur.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isLoading ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    )
  }

  return (
    <Card className={embedded ? "border" : "w-full max-w-2xl mx-auto"}>
      {embedded ? null : (
        <CardHeader>
          <CardTitle>{manualCollectionOnly ? "Manuel Tahsilat" : "Yeni Ödeme"}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-4" : undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {manualCollectionOnly ? (
              <div className="flex gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Bu ekran sadece alınan parayı kaydeder.</p>
                  <p className="mt-1 text-muted-foreground">
                    Satış, fatura, domain veya hosting kaydı oluşturmaz. Yeni satış için Direkt Satış ekranını kullanın.
                  </p>
                </div>
              </div>
            ) : null}

            {manualCollectionOnly && selectedCustomerId ? (
              <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Müşteri cari borcu</p>
                    <p className="mt-1 text-muted-foreground">
                      {balanceLoading
                        ? "Cari bakiye yükleniyor"
                        : `Brüt/Yasal: ${formatMoney(grossBalance)} · KDV hariç: ${formatMoney(taxExcludedBalance)}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tahsilat cari bakiyeyi brüt/yasal tutar üzerinden düşürür.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={balanceLoading || collectibleBalance <= 0}
                  onClick={fillCollectibleBalance}
                >
                  Borç Kadar Doldur
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Müşteri</FormLabel>
                    <Select onValueChange={(v) => {
                      field.onChange(v)
                      if (manualCollectionOnly) {
                        loadCustomerBalance(v)
                      } else {
                        loadSubscriptions(v)
                      }
                    }} defaultValue={field.value || undefined}>
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

              {!manualCollectionOnly ? (
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
              ) : null}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{manualCollectionOnly ? "Tahsilat Tutarı (TL)" : "Ödeme Tutarı (TL)"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Örn: 1500"
                          inputMode="decimal"
                          pattern="[0-9]+(\.[0-9]{1,2})?"
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
                    <FormLabel>{manualCollectionOnly ? "Tahsilat Tarihi" : "Vade"}</FormLabel>
                    <FormControl>
                      <Input type="date" aria-required="true" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!manualCollectionOnly ? (
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
              ) : null}

              {!manualCollectionOnly ? (
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
              ) : null}

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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : manualCollectionOnly ? "Tahsilatı Kaydet" : "Kaydet"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
