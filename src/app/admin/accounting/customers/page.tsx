"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Calculator, Search, MoreHorizontal, Eye, History } from "lucide-react";
import { toast } from "sonner";

interface CustomerWithBalance {
  id: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  currentBalance: string;
  createdAt: string;
}

export default function AccountingCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/accounting/customers?${params}`);
      if (!response.ok) throw new Error("Müşteriler alınamadı");

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      toast.error("Müşteriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getBalanceStatus = (balance: string) => {
    const num = parseFloat(balance);
    if (num > 0) {
      return <Badge className="bg-red-500 hover:bg-red-600">Borçlu</Badge>;
    } else if (num < 0) {
      return <Badge className="bg-green-500 hover:bg-green-600">Alacaklı</Badge>;
    }
    return <Badge variant="outline">Bakiye 0</Badge>;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cari Hesaplar"
        description="Müşteri bazlı borç/alacak takibi"
      />

      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müşteri ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Şehir</TableHead>
                <TableHead>Bakiye</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Müşteri bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.fullName}
                    </TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell className="font-mono">
                      {formatBalance(customer.currentBalance)}
                    </TableCell>
                    <TableCell>{getBalanceStatus(customer.currentBalance)}</TableCell>
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
                              router.push(`/admin/accounting/customers/${customer.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/accounting/customers/${customer.id}/transactions`)
                            }
                          >
                            <History className="mr-2 h-4 w-4" />
                            Hareketler
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
