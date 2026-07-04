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
import { FolderOpen, Plus, ArrowLeft, Trash2, Tag, Pencil } from "lucide-react";
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

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ProductGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    sortOrder: 0,
  });

  const predefinedColors = [
    // Red
    "#B71C1C", "#F44336", "#EF9A9A",
    // Pink
    "#880E4F", "#E91E63", "#F48FB1",
    // Purple
    "#4A148C", "#9C27B0", "#CE93D8",
    // Deep Purple
    "#311B92", "#673AB7", "#B39DDB",
    // Indigo
    "#1A237E", "#3F51B5", "#9FA8DA",
    // Blue
    "#0D47A1", "#2196F3", "#90CAF9",
    // Cyan
    "#006064", "#00BCD4", "#80DEEA",
    // Teal
    "#004D40", "#009688", "#80CBC4",
    // Green
    "#1B5E20", "#4CAF50", "#A5D6A7",
    // Lime
    "#827717", "#CDDC39", "#E6EE9C",
    // Yellow
    "#F57F17", "#FFC107", "#FFE082",
    // Orange
    "#E65100", "#FF9800", "#FFCC80",
    // Brown
    "#3E2723", "#795548", "#BCAAA4",
    // Grey
    "#212121", "#607D8B", "#B0BEC5",
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Grup oluşturulamadı"));
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Silme başarısız"));
    }
  };

  const handleEdit = (group: ProductGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color,
      sortOrder: group.sortOrder,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      const response = await fetch(`/api/product-groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Güncelleme başarısız");
      }
      toast.success("Grup güncellendi");
      setEditDialogOpen(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (error) {
      toast.error(getErrorMessage(error, "Güncelleme başarısız"));
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(group)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(group.id)}
                          disabled={group._count.products > 0}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Düzenle Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grubu Düzenle</DialogTitle>
            <DialogDescription>Grup bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Grup Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Örn: Switch"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Açıklama</Label>
              <Input
                id="edit-description"
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
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>İptal</Button>
              <Button type="submit">Güncelle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
