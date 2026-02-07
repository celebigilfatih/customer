"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { taskCreateSchema, type TaskCreate } from "@/lib/validations"
import { toast } from "sonner"
import { ClipboardList, User, AlignLeft, CheckCircle2, UserCircle2, Building2 } from "lucide-react"

type SimpleCustomer = { id: string; fullName: string }
type SimpleUser = { id: string; fullName: string | null; username: string }

interface TaskFormProps {
  onSubmit?: (data: TaskCreate) => Promise<void>
  onSuccess?: () => void
  onCancel: () => void
  embedded?: boolean
}

export function TaskForm({ onSubmit, onSuccess, onCancel, embedded = false }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<SimpleCustomer[]>([])
  const [users, setUsers] = useState<SimpleUser[]>([])

  const form = useForm({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      customerId: "",
      title: "",
      description: "",
      status: "OPEN",
      assigneeId: undefined,
    } as TaskCreate,
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
    const loadUsers = async () => {
      try {
        const res = await fetch(`/api/users`)
        if (!res.ok) return
        const data = await res.json()
        setUsers(data || [])
      } catch {}
    }
    loadCustomers()
    loadUsers()
  }, [])

  const handleSubmit = async (data: TaskCreate) => {
    setIsLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        const response = await fetch(`/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error("Kaydetme başarısız")
      }
      toast.success("Görev başarıyla oluşturuldu")
      onSuccess?.()
    } catch {
      toast.error("Görev kaydedilemedi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={embedded ? undefined : "w-full max-w-3xl mx-auto"}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Görev Bilgileri</CardTitle>
            <CardDescription>Görev detaylarını doldurun</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                <span>Temel Bilgiler</span>
              </div>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık</FormLabel>
                      <FormControl>
                        <Input placeholder="Görev başlığı girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Müşteri
                        </div>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
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
              </div>
            </div>

            {/* Status & Assignment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Durum ve Atama</span>
              </div>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="OPEN">Açık</SelectItem>
                          <SelectItem value="PENDING">Bekliyor</SelectItem>
                          <SelectItem value="DONE">Tamamlandı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4" />
                          Atanan (opsiyonel)
                        </div>
                      </FormLabel>
                      <Select onValueChange={(v) => field.onChange(v)} defaultValue={(field.value as string | undefined) || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kullanıcı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.fullName || u.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlignLeft className="h-4 w-4" />
                <span>Açıklama</span>
              </div>
              <Separator />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görev Açıklaması</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={5} 
                        placeholder="Görev detaylarını buraya yazın..." 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
