"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Plus, User, Mail, Lock, UserCircle, Shield } from "lucide-react";

const userSchema = z.object({
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  fullName: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  role: z.enum(["ADMIN", "SUPPORT", "CUSTOMER"]),
  customerId: z.string().optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.role === "CUSTOMER" && !data.customerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerId"],
      message: "Müşteri portal kullanıcısı için müşteri seçin",
    });
  }
});

type UserFormInput = z.input<typeof userSchema>;
type UserFormData = z.output<typeof userSchema>;

interface CustomerOption {
  id: string;
  fullName: string;
  club?: string | null;
}

function customerLabel(customer: CustomerOption) {
  return customer.club ? `${customer.club} - ${customer.fullName}` : customer.fullName;
}

export default function AdminUserAddPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const form = useForm<UserFormInput, unknown, UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "SUPPORT",
      customerId: undefined,
      isActive: true,
    },
  });

  const selectedRole = form.watch("role");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("/api/customers?limit=100");
        if (!response.ok) throw new Error("Müşteriler yüklenemedi");
        const payload = await response.json();
        setCustomers(payload.data || []);
      } catch {
        toast.error("Müşteri listesi yüklenemedi");
      }
    }

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedRole !== "CUSTOMER") {
      form.setValue("customerId", undefined);
    }
  }, [form, selectedRole]);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        customerId: data.role === "CUSTOMER" ? data.customerId : null,
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Kullanıcı oluşturulamadı");
      }

      toast.success("Kullanıcı başarıyla oluşturuldu");
      router.push("/admin/users");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Kullanıcı"
        description="Yeni bir sistem kullanıcısı oluşturun"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Kullanıcılar", href: "/admin/users" },
          { label: "Yeni Kullanıcı" },
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
              <CardDescription>Yeni kullanıcı için bilgileri doldurun</CardDescription>
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

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Erişim Yetkisi</span>
                </div>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SUPPORT">Destek / Operatör</SelectItem>
                            <SelectItem value="ADMIN">Yönetici</SelectItem>
                            <SelectItem value="CUSTOMER">Müşteri Portalı</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRole === "CUSTOMER" && (
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bağlı Müşteri</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Müşteri seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customerLabel(customer)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
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
                      <FormLabel>Şifre</FormLabel>
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
                          Kullanıcı rolü ve müşteri bağlantısı uygunsa giriş yapabilir
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
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
