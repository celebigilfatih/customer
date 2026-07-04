"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, Save } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/lib/routes"

type DomainForm = {
  id: string
  name: string
  registerDate: string
  renewDate: string
  autoRenew: boolean
  whoisNote: string
}

type HostingForm = {
  id: string
  name: string
  endDate: string
  notes: string
}

type Sale = {
  id: string
  number: string
  status: string
  dueDate: string
  notes?: string | null
  items: Array<{
    id: string
    description: string
    domain?: {
      id: string
      name: string
      registerDate: string
      renewDate: string
      autoRenew: boolean
      whoisNote?: string | null
    } | null
    hosting?: {
      id: string
      name: string
      endDate: string
      notes?: string | null
    } | null
  }>
}

function toDateInput(value?: string | null) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

export default function AdminSaleEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [sale, setSale] = useState<Sale | null>(null)
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [domains, setDomains] = useState<DomainForm[]>([])
  const [hostings, setHostings] = useState<HostingForm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSale = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/sales/${params.id}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Satış detayı alınamadı")
        const data: Sale = await response.json()
        setSale(data)
        setDueDate(toDateInput(data.dueDate))
        setNotes(data.notes || "")
        setDomains(
          data.items.flatMap((item) =>
            item.domain
              ? [
                  {
                    id: item.domain.id,
                    name: item.domain.name,
                    registerDate: toDateInput(item.domain.registerDate),
                    renewDate: toDateInput(item.domain.renewDate),
                    autoRenew: item.domain.autoRenew,
                    whoisNote: item.domain.whoisNote || "",
                  },
                ]
              : []
          )
        )
        setHostings(
          data.items.flatMap((item) =>
            item.hosting
              ? [
                  {
                    id: item.hosting.id,
                    name: item.hosting.name,
                    endDate: toDateInput(item.hosting.endDate),
                    notes: item.hosting.notes || "",
                  },
                ]
              : []
          )
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Satış detayı alınamadı")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) loadSale()
  }, [params.id])

  const save = async () => {
    if (!sale) return
    setSaving(true)
    setError(null)

    try {
      const saleResponse = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate, notes }),
      })
      const saleData = await saleResponse.json()
      if (!saleResponse.ok) throw new Error(saleData.error || "Satış güncellenemedi")

      for (const domain of domains) {
        const response = await fetch(`/api/domains/${domain.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: domain.name,
            registerDate: domain.registerDate,
            renewDate: domain.renewDate,
            autoRenew: domain.autoRenew,
            whoisNote: domain.whoisNote,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Domain bilgisi güncellenemedi")
      }

      for (const hosting of hostings) {
        const response = await fetch(`/api/hosting/${hosting.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: hosting.name,
            endDate: hosting.endDate,
            notes: hosting.notes,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Hosting bilgisi güncellenemedi")
      }

      router.push(`/admin/sales/${sale.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satış güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={sale ? `Satış Düzenle ${sale.number}` : "Satış Düzenle"}
        description="Sadece not, vade ve bağlı operasyon bilgileri düzenlenebilir"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Satışlar", href: routes.admin.sales },
          { label: sale?.number || "Satış", href: sale ? `/admin/sales/${sale.id}` : undefined },
          { label: "Düzenle" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
            <Button onClick={save} disabled={saving || loading || sale?.status === "CANCELLED"}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sale?.status === "CANCELLED" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>İptal edilmiş satışlar düzenlenemez.</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Satış yükleniyor</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Satış Metadatası</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Vade Tarihi</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Not</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {domains.map((domain, index) => (
            <Card key={domain.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Domain Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Domain</Label>
                  <Input
                    value={domain.name}
                    onChange={(event) =>
                      setDomains((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kayıt Tarihi</Label>
                  <Input
                    type="date"
                    value={domain.registerDate}
                    onChange={(event) =>
                      setDomains((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, registerDate: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yenileme Tarihi</Label>
                  <Input
                    type="date"
                    value={domain.renewDate}
                    onChange={(event) =>
                      setDomains((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, renewDate: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={domain.autoRenew}
                    onCheckedChange={(checked) =>
                      setDomains((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, autoRenew: checked } : item
                        )
                      )
                    }
                  />
                  <Label>Otomatik yenileme</Label>
                </div>
                <div className="space-y-2 md:col-span-4">
                  <Label>Not</Label>
                  <Textarea
                    value={domain.whoisNote}
                    onChange={(event) =>
                      setDomains((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, whoisNote: event.target.value } : item
                        )
                      )
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {hostings.map((hosting, index) => (
            <Card key={hosting.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hosting Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Hizmet Adı</Label>
                  <Input
                    value={hosting.name}
                    onChange={(event) =>
                      setHostings((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={hosting.endDate}
                    onChange={(event) =>
                      setHostings((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, endDate: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Not</Label>
                  <Textarea
                    value={hosting.notes}
                    onChange={(event) =>
                      setHostings((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, notes: event.target.value } : item
                        )
                      )
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {domains.length === 0 && hostings.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Bu satışa bağlı domain veya hosting operasyon kaydı yok.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
