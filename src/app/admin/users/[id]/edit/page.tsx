"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Save, User, Mail, Lock, UserCircle } from "lucide-react";

const userSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  fullName: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
}

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      isActive: true,
    },
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Kullanıcılar yüklenemedi");
      const users = await response.json();
      const foundUser = users.find((u: User) => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
        form.reset({
          username: foundUser.username,
          fullName: foundUser.fullName || "",
          email: foundUser.email,
          password: "",
          isActive: foundUser.isActive,
        });
      }
    } catch (err) {
      toast.error("Kullanıcı bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (!payload.password) {
        delete (payload as { password?: string }).password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kullanıcı güncellenemedi");
      }

      toast.success("Kullanıcı başarıyla güncellendi");
      router.push("/admin/users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="max-w-2xl">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kullanıcı Düzenle"
          description="Kullanıcı bilgilerini güncelleyin"
          breadcrumbs={[
            { label: "Admin", href: routes.admin.root },
            { label: "Kullanıcılar", href: "/admin/users" },
            { label: "Düzenle" },
          ]}
        />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Kullanıcı bulunamadı
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Düzenle"
        description="Kullanıcı bilgilerini güncelleyin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Kullanıcılar", href: "/admin/users" },
          { label: user.username },
        ]}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
              <CardDescription>@{user.username} için bilgileri güncelleyin</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Hesap Bilgileri</span>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="kullaniciadi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Soyad (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ad Soyad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>İletişim</span>
                </div>
                <Separator />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Security */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Güvenlik</span>
                </div>
                <Separator />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre (Boş bırakırsanız değişmez)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktif Kullanıcı</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Kullanıcı giriş yapabilir
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/users")}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
