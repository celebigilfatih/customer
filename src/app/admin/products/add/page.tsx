"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Package, ArrowLeft, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductGroup {
  id: string;
  name: string;
}

const onDemandServiceGroups = new Set(["domain", "hosting"]);

function isOnDemandServiceGroup(group?: ProductGroup) {
  return group ? onDemandServiceGroups.has(group.name.trim().toLocaleLowerCase("tr-TR")) : false;
}

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [formData, setFormData] = useState({
    type: "PRODUCT" as "PRODUCT" | "SERVICE",
    code: "",
    name: "",
    description: "",
    groupId: "ungrouped",
    stockQuantity: "0",
    minStockLevel: "0",
    costPrice: "",
    profitMargin: "0",
    unitPrice: "",
    currency: "TRY",
  });

  // Satış fiyatını otomatik hesapla
  useEffect(() => {
    if (formData.costPrice && formData.profitMargin) {
      const cost = parseFloat(formData.costPrice);
      const margin = parseFloat(formData.profitMargin);
      if (!isNaN(cost) && !isNaN(margin)) {
        const calculatedPrice = cost * (1 + margin / 100);
        setFormData(prev => ({
          ...prev,
          unitPrice: calculatedPrice.toFixed(2)
        }));
      }
    }
  }, [formData.costPrice, formData.profitMargin]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/product-groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Gruplar yüklenirken hata:", error);
    }
  };

  const handleGroupChange = (groupId: string) => {
    const selectedGroup = groups.find((group) => group.id === groupId);
    const shouldUseServiceType = isOnDemandServiceGroup(selectedGroup);

    setFormData({
      ...formData,
      groupId,
      type: shouldUseServiceType ? "SERVICE" : formData.type,
      stockQuantity: shouldUseServiceType ? "0" : formData.stockQuantity,
      minStockLevel: shouldUseServiceType ? "0" : formData.minStockLevel,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId === "ungrouped" ? undefined : formData.groupId,
          stockQuantity: formData.type === "SERVICE" ? 0 : parseFloat(formData.stockQuantity),
          minStockLevel: formData.type === "SERVICE" ? 0 : parseFloat(formData.minStockLevel),
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
          profitMargin: formData.profitMargin ? parseFloat(formData.profitMargin) : undefined,
          unitPrice: parseFloat(formData.unitPrice),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ürün oluşturulamadı");
      }

      toast.success("Ürün başarıyla oluşturuldu");
      router.push("/admin/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ürün oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Katalog Kalemi"
        description="Satış kataloğuna yeni kayıt ekle"
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Katalog Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Kayıt Tipi *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "PRODUCT" | "SERVICE") =>
                    setFormData({
                      ...formData,
                      type: value,
                      stockQuantity: value === "SERVICE" ? "0" : formData.stockQuantity,
                      minStockLevel: value === "SERVICE" ? "0" : formData.minStockLevel,
                    })
                  }
                >
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
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder={formData.type === "SERVICE" ? "HIZ-001" : "URN-001"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ad *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={formData.type === "SERVICE" ? "Bakım Hizmeti" : "Örnek Ürün"}
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
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin (opsiyonel)" />
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ürün açıklaması..."
                rows={3}
              />
            </div>

            {formData.type === "PRODUCT" ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Açılış Stoğu</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Min. Stok Seviyesi</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockLevel: e.target.value })
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Maliyet Fiyatı</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                  placeholder="0.00"
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
                  onChange={(e) =>
                    setFormData({ ...formData, profitMargin: e.target.value })
                  }
                  placeholder="0"
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
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maliyet + Kar marjından otomatik hesaplanır
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/products")}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
