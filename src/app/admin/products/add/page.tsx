"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Package, ArrowLeft } from "lucide-react";
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

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    groupId: "",
    stockQuantity: "0",
    minStockLevel: "0",
    unitPrice: "",
    currency: "TRY",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId || undefined,
          stockQuantity: parseFloat(formData.stockQuantity),
          minStockLevel: parseFloat(formData.minStockLevel),
          unitPrice: parseFloat(formData.unitPrice),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ürün oluşturulamadı");
      }

      toast.success("Ürün başarıyla oluşturuldu");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Ürün"
        description="Stok takibi yapılacak yeni ürün ekle"
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
          <CardTitle>Ürün Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Ürün Kodu *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="ORN-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Örnek Ürün"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Ürün Grubu</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, groupId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Gruplansız</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Birim Fiyat *</Label>
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
