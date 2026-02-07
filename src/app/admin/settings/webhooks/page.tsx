"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Webhook, Save, Play, RefreshCw, CheckCircle2, XCircle } from "lucide-react"

export default function AdminWebhookSettingsPage() {
  const [urlsText, setUrlsText] = useState("")
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<{ id: string; event: string; url: string; ok: boolean; statusCode?: number; error?: string; attempt: number; timestamp: number }[]>([])
  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [filterEvent, setFilterEvent] = useState<string>("ALL")
  const [filterUrl, setFilterUrl] = useState<string>("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [queueStats, setQueueStats] = useState<{ pending: number; nextInMs: number }>({ pending: 0, nextInMs: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/system/webhooks')
        if (!res.ok) throw new Error('Konfigürasyon alınamadı')
        const data = await res.json()
        setUrlsText((data.urls || []).join(', '))
        setSecret(data.secret ? '*****' : '')
        const lr = await fetch('/api/system/webhooks/logs')
        if (lr.ok) {
          const lj = await lr.json()
          setLogs(lj.data || [])
        }
        const qs = await fetch('/api/system/webhooks/queue')
        if (qs.ok) setQueueStats(await qs.json())
      } catch {
        toast.error('Webhook konfigürasyonu yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    try {
      const res = await fetch('/api/system/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlsText, secret: secret === '*****' ? '' : secret }),
      })
      if (!res.ok) throw new Error('Kaydedilemedi')
      toast.success('Webhook konfigürasyonu kaydedildi')
    } catch {
      toast.error('Kaydetme başarısız')
    }
  }

  const testDaily = async () => {
    try {
      const res = await fetch('/api/cron/daily')
      if (!res.ok) throw new Error('Cron çağrısı başarısız')
      const data = await res.json()
      toast.success(`Özet gönderildi: payments=${data.upcoming7Days?.payments || 0}`)
      const lr = await fetch('/api/system/webhooks/logs')
      if (lr.ok) {
        const lj = await lr.json()
        setLogs(lj.data || [])
      }
      const qs = await fetch('/api/system/webhooks/queue')
      if (qs.ok) setQueueStats(await qs.json())
    } catch {
      toast.error('Cron çağrısı başarısız')
    }
  }

  const retryLog = async (event: string, url: string) => {
    try {
      const res = await fetch('/api/system/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, url }),
      })
      if (!res.ok) throw new Error('Retry başarısız')
      toast.success('Retry gönderildi')
      const lr = await fetch('/api/system/webhooks/logs')
      if (lr.ok) {
        const lj = await lr.json()
        setLogs(lj.data || [])
      }
    } catch {
      toast.error('Retry gönderilemedi')
    }
  }

  const batchRetry = async () => {
    try {
      const targets = logs.filter(l => !l.ok)
        .filter(l => !filterEvent || l.event === filterEvent)
        .filter(l => !filterUrl || (l.url || "").toLowerCase().includes(filterUrl.toLowerCase()))
        .slice(0, 50)
      if (targets.length === 0) {
        toast.info('Kriterlere uyan başarısız kayıt yok')
        return
      }
      await Promise.all(targets.map(t => fetch('/api/system/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: t.event, url: t.url }),
      })))
      toast.success(`Toplu retry gönderildi (${targets.length})`)
      const lr = await fetch('/api/system/webhooks/logs')
      if (lr.ok) {
        const lj = await lr.json()
        setLogs(lj.data || [])
      }
      const qs = await fetch('/api/system/webhooks/queue')
      if (qs.ok) setQueueStats(await qs.json())
    } catch {
      toast.error('Toplu retry başarısız')
    }
  }

  const retrySelected = async () => {
    try {
      const targets = logs.filter(l => selectedIds.includes(l.id))
      if (targets.length === 0) {
        toast.info('Seçili kayıt yok')
        return
      }
      await Promise.all(targets.map(t => fetch('/api/system/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: t.event, url: t.url }),
      })))
      toast.success(`Seçilenler yeniden gönderildi (${targets.length})`)
      const lr = await fetch('/api/system/webhooks/logs')
      if (lr.ok) {
        const lj = await lr.json()
        setLogs(lj.data || [])
      }
      const qs = await fetch('/api/system/webhooks/queue')
      if (qs.ok) setQueueStats(await qs.json())
      setSelectedIds([])
    } catch {
      toast.error('Seçilenler retry başarısız')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhook Ayarları"
        description="Webhook entegrasyonlarını yapılandırın ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Ayarlar", href: "/admin/settings" },
          { label: "Webhooklar" },
        ]}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <CardTitle>Konfigürasyon</CardTitle>
          </div>
          <CardDescription>
            Webhook URL'leri ve güvenlik ayarları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
          {!loading && (
            <>
              <div className="space-y-2">
                <label className="text-sm">Webhook URL’leri (virgülle ayır)</label>
                <Textarea value={urlsText} onChange={(e) => setUrlsText(e.target.value)} placeholder="https://example.com/a, https://example.com/b" />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Secret (opsiyonel)</label>
                <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="HMAC secret" />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={save}>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
                <Button variant="outline" onClick={testDaily}>
                  <Play className="mr-2 h-4 w-4" />
                  Günlük Cron'u Test Et
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Webhook Logları</CardTitle>
              <Badge variant="secondary">{logs.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFailedOnly(v => !v)}>
                {showFailedOnly ? 'Tümünü Göster' : 'Sadece Başarısızlar'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Son webhook çağrılarının log kayıtları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Kuyruk:</span>
              <Badge variant="outline">{queueStats.pending} bekleyen</Badge>
              <span className="text-xs text-muted-foreground">Sonraki: {Math.ceil(queueStats.nextInMs/1000)} sn</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Event</label>
                <Select onValueChange={(v) => setFilterEvent(v)} defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tümü</SelectItem>
                    <SelectItem value="daily-summary">daily-summary</SelectItem>
                    <SelectItem value="due-payments">due-payments</SelectItem>
                    <SelectItem value="expiring-services">expiring-services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">URL İçeren</label>
                <Input value={filterUrl} onChange={(e) => setFilterUrl(e.target.value)} placeholder="example.com" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={batchRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Başarısızları Toplu Yeniden Dene
              </Button>
              <Button variant="outline" size="sm" onClick={retrySelected}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Seçilenleri Yeniden Dene
              </Button>
            </div>
            <Separator />
            {logs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Kayıt yok</div>
            )}
            {logs.length > 0 && (
              <div className="space-y-2">
                {logs.filter(l => !showFailedOnly || !l.ok)
                      .filter(l => filterEvent === "ALL" || l.event === filterEvent)
                      .filter(l => !filterUrl || (l.url || "").toLowerCase().includes(filterUrl.toLowerCase()))
                      .slice(0, 30)
                      .map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(l.id)} 
                        onChange={(e) => {
                          setSelectedIds(prev => e.target.checked ? [...prev, l.id] : prev.filter(x => x !== l.id))
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{l.event}</span>
                        <span className="text-xs text-muted-foreground">{l.url} • {new Date(l.timestamp).toLocaleString('tr-TR')} • Deneme {l.attempt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.ok ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {l.statusCode}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Hata
                        </Badge>
                      )}
                      {!l.ok && (
                        <Button variant="ghost" size="sm" onClick={() => retryLog(l.event, l.url)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
