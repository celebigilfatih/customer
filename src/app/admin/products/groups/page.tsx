"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderOpen, Plus, ArrowLeft, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface ProductGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sortOrder: number;
  _count: {
    products: number;
  };
}

export default function ProductGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    sortOrder: 0,
  });

  const predefinedColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#22c55e", // green
    "#f59e0b", // yellow
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
    "#84cc16", // lime
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/product-groups");
      if (!response.ok) throw new Error("Gruplar alınamadı");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      toast.error("Gruplar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/product-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Grup oluşturulamadı");
      }

      toast.success("Grup başarıyla oluşturuldu");
      setDialogOpen(false);
      setFormData({ name: "", description: "", color: "#3b82f6", sortOrder: 0 });
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`/api/product-groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Silme başarısız");
      }

      toast.success("Grup silindi");
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürün Grupları"
        description="Ürünleri kategorize etmek için gruplar oluşturun"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/products")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ürünlere Dön
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Grup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Ürün Grubu</DialogTitle>
                  <DialogDescription>
                    Örn: Switch, Firewall, Modem, Mouse, Klavye, vb.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Grup Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Örn: Switch"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Grup açıklaması..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Renk</Label>
                    <div className="flex flex-wrap gap-2">
                      {predefinedColors.map((color: string) => (
                        <div
                          key={color}
                          role="button"
                          className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                            formData.color === color
                              ? "border-gray-900"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Oluştur</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Gruplar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renk</TableHead>
                <TableHead>Grup Adı</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Ürün Sayısı</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Henüz grup oluşturulmamış
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <span
                        className="w-6 h-6 rounded-full inline-block"
                        style={{ backgroundColor: group.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag
                          className="h-4 w-4"
                          style={{ color: group.color }}
                        />
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {group._count.products} ürün
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                        disabled={group._count.products > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
