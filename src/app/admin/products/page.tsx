"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, Search, MoreHorizontal, Edit, Trash2, History, FolderOpen, Tag, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  code: string;
  name: string;
  type: "PRODUCT" | "SERVICE";
  description: string | null;
  groupId: string | null;
  group: ProductGroup | null;
  stockQuantity: string;
  minStockLevel: string;
  unitPrice: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    proposalItems: number;
    invoiceItems: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Ürünler alınamadı");

      const data = await response.json();
      setProducts(data);
    } catch {
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/product-groups");
      if (!response.ok) throw new Error("Gruplar alınamadı");
      const data = await response.json();
      setGroups(data);
    } catch {
      console.error("Gruplar yüklenirken hata");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchGroups();
  }, [fetchGroups, fetchProducts]);

  const filteredProducts = selectedGroup === "all" 
    ? products 
    : selectedGroup === "ungrouped"
    ? products.filter(p => !p.groupId)
    : products.filter(p => p.groupId === selectedGroup);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Silme başarısız");

      const data = await response.json();
      toast.success(data.message);
      fetchProducts();
    } catch {
      toast.error("Ürün silinirken hata oluştu");
    }
  };

  const formatStockValue = (value: string) => {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) ? String(numericValue) : value;
  };

  const getStockStatus = (product: Product) => {
    if (product.type === "SERVICE") {
      return <Badge variant="secondary">Stok yok</Badge>;
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
      <PageHeader
        title="Satış Kataloğu"
        description="Satış kataloğu ve stok takibi"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/products/groups")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Gruplar
            </Button>
            <Button onClick={() => router.push("/admin/products/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kayıt
            </Button>
          </div>
        }
      />

      <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="all">
            Tümü ({products.length})
          </TabsTrigger>
          <TabsTrigger value="ungrouped">
            Gruplansız ({products.filter(p => !p.groupId).length})
          </TabsTrigger>
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              <span 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: group.color }}
              />
              {group.name} ({group._count.products})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün kodu veya adı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead>Stok Durumu</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kullanım</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Kayıt bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-muted-foreground">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.type === "SERVICE" ? (
                        <Badge variant="secondary">
                          <Wrench className="mr-1 h-3 w-3" />
                          Hizmet
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Package className="mr-1 h-3 w-3" />
                          Ürün
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.group ? (
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: product.group.color,
                            color: product.group.color 
                          }}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {product.group.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Gruplansız</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-2">
                        {product.type === "PRODUCT" ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{formatStockValue(product.stockQuantity)}</span>
                              {getStockStatus(product)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Min: {formatStockValue(product.minStockLevel)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => router.push(`/admin/products/${product.id}/stock`)}
                            >
                              <History className="mr-1 h-3 w-3" />
                              Stok Düzenle
                            </Button>
                          </>
                        ) : (
                          getStockStatus(product)
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {parseFloat(product.unitPrice).toLocaleString("tr-TR", {
                        style: "currency",
                        currency: product.currency,
                      })}
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="outline">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Teklif: {product._count?.proposalItems || 0}</div>
                        <div>Fatura: {product._count?.invoiceItems || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {product.type === "PRODUCT" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/products/${product.id}/stock`)
                              }
                            >
                              <History className="mr-2 h-4 w-4" />
                              Stok Düzenle
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/products/${product.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
