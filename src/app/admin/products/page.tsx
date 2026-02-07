"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, Search, MoreHorizontal, Edit, Trash2, History, FolderOpen, Tag } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  description: string | null;
  groupId: string | null;
  group: ProductGroup | null;
  stockQuantity: string;
  minStockLevel: string;
  unitPrice: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  _count: {
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

  useEffect(() => {
    fetchProducts();
    fetchGroups();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Ürünler alınamadı");

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Ürünler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/product-groups");
      if (!response.ok) throw new Error("Gruplar alınamadı");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Gruplar yüklenirken hata:", error);
    }
  };

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
    } catch (error) {
      toast.error("Ürün silinirken hata oluştu");
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = parseFloat(product.stockQuantity);
    const minLevel = parseFloat(product.minStockLevel);

    if (stock <= 0) {
      return <Badge variant="destructive">Stok Yok</Badge>;
    } else if (stock <= minLevel) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Kritik Stok</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Stokta</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürünler"
        description="Stok takibi yapılan ürün ve hizmetler"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/products/groups")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Gruplar
            </Button>
            <Button onClick={() => router.push("/admin/products/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
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
                <TableHead>Grup</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kullanım</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Ürün bulunamadı
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
                      <div className="flex flex-col gap-1">
                        <span>{product.stockQuantity}</span>
                        {getStockStatus(product)}
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
                        <div>Teklif: {product._count.proposalItems}</div>
                        <div>Fatura: {product._count.invoiceItems}</div>
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/products/${product.id}/stock`)
                            }
                          >
                            <History className="mr-2 h-4 w-4" />
                            Stok Hareketleri
                          </DropdownMenuItem>
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
