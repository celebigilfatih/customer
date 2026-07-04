"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, History, Package, Wrench } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type CatalogType = "PRODUCT" | "SERVICE"

type ProductGroup = {
  id: string
  name: string
}

const onDemandServiceGroups = new Set(["domain", "hosting"])

function isOnDemandServiceGroup(group?: ProductGroup) {
  return group ? onDemandServiceGroups.has(group.name.trim().toLocaleLowerCase("tr-TR")) : false
}

type Product = {
  id: string
  code: string
  name: string
  type: CatalogType
  description: string | null
  groupId: string | null
  minStockLevel: string | number
  costPrice: string | number | null
  profitMargin: string | number | null
  unitPrice: string | number
  currency: string
  isActive: boolean
}

function valueToString(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value)
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [formData, setFormData] = useState({
    type: "PRODUCT" as CatalogType,
    code: "",
    name: "",
    description: "",
    groupId: "ungrouped",
    minStockLevel: "0",
    costPrice: "",
    profitMargin: "0",
    unitPrice: "",
    currency: "TRY",
    isActive: true,
  })

  useEffect(() => {
    if (formData.costPrice && formData.profitMargin) {
      const cost = parseFloat(formData.costPrice)
      const margin = parseFloat(formData.profitMargin)
      if (!Number.isNaN(cost) && !Number.isNaN(margin)) {
        const calculatedPrice = cost * (1 + margin / 100)
        setFormData((current) => ({
          ...current,
          unitPrice: calculatedPrice.toFixed(2),
        }))
      }
    }
  }, [formData.costPrice, formData.profitMargin])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [productResponse, groupsResponse] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch("/api/product-groups"),
        ])

        if (!productResponse.ok) throw new Error("Kayıt alınamadı")
        const product = (await productResponse.json()) as Product
        setFormData({
          type: product.type,
          code: product.code,
          name: product.name,
          description: product.description || "",
          groupId: product.groupId || "ungrouped",
          minStockLevel: valueToString(product.minStockLevel) || "0",
          costPrice: valueToString(product.costPrice),
          profitMargin: valueToString(product.profitMargin) || "0",
          unitPrice: valueToString(product.unitPrice),
          currency: product.currency,
          isActive: product.isActive,
        })

        if (groupsResponse.ok) {
          setGroups(await groupsResponse.json())
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kayıt yüklenemedi")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [productId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          groupId: formData.groupId === "ungrouped" ? undefined : formData.groupId,
          minStockLevel: formData.type === "SERVICE" ? 0 : parseFloat(formData.minStockLevel),
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          profitMargin: formData.profitMargin ? parseFloat(formData.profitMargin) : null,
          unitPrice: parseFloat(formData.unitPrice),
          currency: formData.currency,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Kayıt güncellenemedi")
      }

      toast.success("Kayıt güncellendi")
      router.push("/admin/products")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayıt güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  const handleTypeChange = (value: string) => {
    const type = value as CatalogType
    setFormData({
      ...formData,
      type,
      minStockLevel: type === "SERVICE" ? "0" : formData.minStockLevel,
    })
  }

  const handleGroupChange = (groupId: string) => {
    const selectedGroup = groups.find((group) => group.id === groupId)
    const shouldUseServiceType = isOnDemandServiceGroup(selectedGroup)

    setFormData({
      ...formData,
      groupId,
      type: shouldUseServiceType ? "SERVICE" : formData.type,
      minStockLevel: shouldUseServiceType ? "0" : formData.minStockLevel,
    })
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katalog Kaydını Düzenle"
        description={formData.name}
        actions={
          <div className="flex gap-2">
            {formData.type === "PRODUCT" ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/products/${productId}/stock`)}
              >
                <History className="mr-2 h-4 w-4" />
                Stok Düzenle
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => router.push("/admin/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Katalog Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Kayıt Tipi *</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Ürün
                      </span>
                    </SelectItem>
                    <SelectItem value="SERVICE">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Hizmet
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Kod *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ad *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Ürün Grubu</Label>
              <Select
                value={formData.groupId}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Grup seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ungrouped">Gruplansız</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                rows={3}
              />
            </div>

            {formData.type === "PRODUCT" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Min. Stok Seviyesi</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minStockLevel}
                    onChange={(event) =>
                      setFormData({ ...formData, minStockLevel: event.target.value })
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Maliyet Fiyatı</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(event) =>
                    setFormData({ ...formData, costPrice: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitMargin">Kar Marjı (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.profitMargin}
                  onChange={(event) =>
                    setFormData({ ...formData, profitMargin: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Satış Fiyatı *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(event) =>
                    setFormData({ ...formData, unitPrice: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === "active" })
                }
              >
                <SelectTrigger id="status" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/products")}
              >
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
