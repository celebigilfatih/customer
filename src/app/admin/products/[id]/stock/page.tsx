"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/back-button";
import { ArrowRight, ArrowLeft, Plus, History } from "lucide-react";
import { toast } from "sonner";

interface StockMovement {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  description: string | null;
  createdAt: string;
  proposal?: {
    number: string;
    customer: {
      fullName: string;
    };
  } | null;
  invoice?: {
    number: string;
    customer: {
      fullName: string;
    };
  } | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  type: "PRODUCT" | "SERVICE";
  stockQuantity: string;
  minStockLevel: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatStockValue = (value: string) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? String(numericValue) : value;
};

export default function ProductStockPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({
    type: "IN" as "IN" | "OUT" | "ADJUSTMENT",
    quantity: "",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/stock`);
      if (!response.ok) throw new Error("Veriler alınamadı");

      const data = await response.json();
      setProduct(data.product);
      setMovements(data.movements || []);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustment = async () => {
    try {
      const quantity = parseFloat(adjustment.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Geçerli bir miktar girin");
        return;
      }

      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustment.type,
          quantity,
          description: adjustment.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Stok ayarlama başarısız");
      }

      toast.success("Stok başarıyla güncellendi");
      setDialogOpen(false);
      setAdjustment({ type: "IN", quantity: "", description: "" });
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Stok ayarlama başarısız"));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStockStatus = () => {
    if (!product) return null;
    if (product.type === "SERVICE") {
      return <Badge variant="secondary">Stok Takibi Yok</Badge>;
    }

    const stock = parseFloat(product.stockQuantity);
    const minLevel = parseFloat(product.minStockLevel);

    if (stock <= 0) {
      return <Badge variant="destructive">Stok Yok</Badge>;
    } else if (stock < minLevel) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Kritik Stok</Badge>;
    } else if (minLevel > 0 && stock === minLevel) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Minimum Eşik</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Stokta</Badge>;
  };

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/admin/products" />

      <PageHeader
        title="Stok Yönetimi"
        description={product?.name || "Ürün stok hareketleri"}
        actions={
          product?.type === "PRODUCT" ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Stok Düzenle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stok Düzenle</DialogTitle>
                  <DialogDescription>
                    Ürün stoğuna giriş, çıkış veya düzeltme yapın
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>İşlem Türü</Label>
                    <Select
                      value={adjustment.type}
                      onValueChange={(v) =>
                        setAdjustment({ ...adjustment, type: v as "IN" | "OUT" | "ADJUSTMENT" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">Stok Girişi (+)</SelectItem>
                        <SelectItem value="OUT">Stok Çıkışı (-)</SelectItem>
                        <SelectItem value="ADJUSTMENT">Stok Düzeltme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Miktar</Label>
                    <Input
                      type="number"
                      value={adjustment.quantity}
                      onChange={(e) =>
                        setAdjustment({ ...adjustment, quantity: e.target.value })
                      }
                      placeholder="Miktar girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={adjustment.description}
                      onChange={(e) =>
                        setAdjustment({ ...adjustment, description: e.target.value })
                      }
                      placeholder="İşlem açıklaması..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleAdjustment}>Kaydet</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {product && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ürün Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ürün Kodu</p>
                <p className="text-lg font-semibold">{product.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ürün Adı</p>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mevcut Stok</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold font-mono">
                    {formatStockValue(product.stockQuantity)}
                  </p>
                  {getStockStatus()}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minimum Stok</p>
                <p className="text-lg font-semibold font-mono">
                  {formatStockValue(product.minStockLevel)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Miktar</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Referans</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Henüz stok hareketi yok
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {formatDate(movement.createdAt)}
                    </TableCell>
                    <TableCell>
                      {movement.type === "IN" ? (
                        <Badge className="flex w-fit items-center gap-1 bg-green-600 hover:bg-green-700">
                          <ArrowRight className="h-3 w-3" />
                          Giriş
                        </Badge>
                      ) : movement.type === "OUT" ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <ArrowLeft className="h-3 w-3" />
                          Çıkış
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex w-fit items-center gap-1">
                          <History className="h-3 w-3" />
                          Düzeltme
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm">
                      {movement.description || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.proposal ? (
                        <span>Teklif: {movement.proposal.number}</span>
                      ) : movement.invoice ? (
                        <span>Fatura: {movement.invoice.number}</span>
                      ) : (
                        "Manuel"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
