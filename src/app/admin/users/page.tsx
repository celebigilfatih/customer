"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Calendar,
  MoreHorizontal,
  Shield,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";

interface User {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Kullanıcılar yüklenemedi");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Kullanıcı silinemedi");
      }

      setUsers(users.filter((user) => user.id !== id));
      toast.success("Kullanıcı silindi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Silme işlemi başarısız");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Kullanıcı durumu güncellenemedi");
      }

      const updatedUser = await response.json();
      setUsers(users.map((user) => (user.id === id ? updatedUser : user)));
      toast.success(`Kullanıcı ${!currentStatus ? "aktif" : "pasif"} duruma getirildi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Durum güncelleme başarısız");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(search.toLowerCase())) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını görüntüleyin ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Kullanıcılar" },
        ]}
        actions={
          <Button onClick={() => router.push("/admin/users/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Sistemde kayıtlı</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Giriş yapabilir</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-gray-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasif</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gray-500/10 flex items-center justify-center">
              <UserX className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Devre dışı</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Kullanıcı Listesi</CardTitle>
              <CardDescription>Tüm kullanıcıları görüntüleyin ve yönetin</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Kullanıcı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Kullanıcı bulunamadı"
              description={
                search
                  ? "Arama kriterlerinize uygun kullanıcı bulunmuyor."
                  : "Henüz kullanıcı eklenmemiş."
              }
              action={
                <Button onClick={() => router.push("/admin/users/add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Kullanıcı Ekle
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Kullanıcı</TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        E-posta
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Durum</TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Kayıt Tarihi
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {(user.fullName || user.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName || user.username}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
