"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface ProposalTypeFormProps {
  initialData?: {
    id?: string
    name: string
    label: string
    isActive: boolean
  }
  onSubmit: (data: { name: string; label: string; isActive: boolean }) => Promise<void>
  onCancel: () => void
}

export function ProposalTypeForm({ initialData, onSubmit, onCancel }: ProposalTypeFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [label, setLabel] = useState(initialData?.label || "")
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit({ name, label, isActive })
      toast.success("Teklif türü başarıyla kaydedildi")
    } catch (error) {
      toast.error("Kayıt başarısız oldu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? "Teklif Türünü Düzenle" : "Yeni Teklif Türü"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Teknik Ad *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Örn: CONSULTING"
              required
              disabled={!!initialData?.id}
            />
            <p className="text-sm text-muted-foreground">
              Teknik ad (sistemde kullanılan). Sadece büyük harfler ve alt çizgi kullanılabilir.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Görünen Ad *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Danışmanlık"
              required
            />
            <p className="text-sm text-muted-foreground">
              Kullanıcılara gösterilen ad
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Aktif</Label>
              <p className="text-sm text-muted-foreground">
                Aktif olmayan türler teklif oluştururken görünmez
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
