"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { routes } from "@/lib/routes"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SubscriptionItem = { id: string; name: string; endDate: string; status: string }
type DomainItem = { id: string; name: string; renewDate: string; registrar: string }
type HostingItem = { id: string; package: string; endDate: string }
type TaskItem = { id: string; title: string; status: string }
type PaymentItem = { id: string; amount: string; currency: string; dueDate: string; status: string }

function getPortalCustomerId(): string | null {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    const u = JSON.parse(raw) as { customerId?: string }
    return u.customerId || null
  } catch {
    return null
  }
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [domains, setDomains] = useState<DomainItem[]>([])
  const [hosting, setHosting] = useState<HostingItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])

  useEffect(() => {
    const id = getPortalCustomerId()
    if (!id) {
      toast.error("Müşteri bilgisi bulunamadı")
      return
    }
    setCustomerId(id)
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      if (!customerId) return
      setLoading(true)
      try {
        const qs = (path: string) => `${path}?limit=100&customerId=${encodeURIComponent(customerId)}`
        const [subsRes, domRes, hostRes, taskRes, payRes] = await Promise.all([
          fetch(qs("/api/subscriptions")),
          fetch(qs("/api/domains")),
          fetch(qs("/api/hosting")),
          fetch(qs("/api/tasks")),
          fetch(qs("/api/payments")),
        ])
        if (!subsRes.ok || !domRes.ok || !hostRes.ok || !taskRes.ok || !payRes.ok) throw new Error("Veri alınamadı")
        const subsJson = await subsRes.json()
        const domJson = await domRes.json()
        const hostJson = await hostRes.json()
        const taskJson = await taskRes.json()
        const payJson = await payRes.json()
        setSubscriptions(subsJson.data || [])
        setDomains(domJson.data || [])
        setHosting(hostJson.data || [])
        setTasks(taskJson.data || [])
        setPayments(payJson.data || [])
      } catch {
        toast.error("Portal verileri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [customerId])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const addDays = (date: Date, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  const inRange = (dateStr: string, start: Date, end: Date) => {
    const d = new Date(dateStr)
    return d >= start && d <= end
  }

  const upcomingEndRange = useMemo(() => addDays(today, 30), [today])
  const upcomingEnds = useMemo(() => {
    const items: { label: string; date: string }[] = []
    subscriptions.forEach(s => { if (inRange(s.endDate, today, upcomingEndRange)) items.push({ label: `Abonelik: ${s.name}`, date: s.endDate }) })
    domains.forEach(d => { if (inRange(d.renewDate, today, upcomingEndRange)) items.push({ label: `Domain: ${d.name}`, date: d.renewDate }) })
    hosting.forEach(h => { if (inRange(h.endDate, today, upcomingEndRange)) items.push({ label: `Hosting: ${h.package}`, date: h.endDate }) })
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6)
  }, [subscriptions, domains, hosting, today, upcomingEndRange])

  const upcomingPayments = useMemo(() => {
    const end = addDays(today, 14)
    const list = payments.filter(p => p.status !== "PAID" && inRange(p.dueDate, today, end))
    const total = list.reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)
    return { list: list.slice(0, 6), total }
  }, [payments, today])

  const openTasks = useMemo(() => tasks.filter(t => t.status !== "DONE"), [tasks])
  const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Müşteri Paneli</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader>
            <CardTitle>Hizmetlerim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
            {!loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Abonelikler</span><span className="font-semibold">{subscriptions.length}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Domainler</span><span className="font-semibold">{domains.length}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Hostingler</span><span className="font-semibold">{hosting.length}</span></div>
                <div className="pt-2">
                  {upcomingEnds.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span>{it.label}</span>
                      <span className="text-gray-600">{fmt(it.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader>
            <CardTitle>Açık Taleplerim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
            {!loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Toplam açık</span><span className="font-semibold">{openTasks.length}</span></div>
                {openTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.title}</span>
                    <span className="text-gray-600">{t.status}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-end"><Button variant="outline" size="sm" onClick={() => router.push(routes.portal.tickets)}>Tüm talepler</Button></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle>Tahsilatlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
          {!loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span>Önümüzdeki 14 gün toplam</span><span className="font-semibold">{upcomingPayments.total} {upcomingPayments.list[0]?.currency || ""}</span></div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vade</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Para Birimi</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingPayments.list.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{fmt(p.dueDate)}</TableCell>
                      <TableCell>{parseInt(p.amount, 10)}</TableCell>
                      <TableCell>{p.currency}</TableCell>
                      <TableCell>{p.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}