"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import { BackButton } from "@/components/back-button";
import {
  ArrowRight,
  ArrowLeft,
  History,
  Phone,
  MapPin,
  Building2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Globe,
  Server,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerDetail {
  id: string;
  fullName: string;
  club: string;
  phoneNumber: string;
  city: string;
  district: string;
  status: string;
  openingBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  debit?: any;
  credit?: any;
  balance: number;
  description: string;
  createdAt: string;
  proposal?: { number: string; title: string } | null;
  invoice?: { number: string } | null;
}

interface Summary {
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export default function AccountingCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/accounting/customers/${customerId}`);
      if (!response.ok) throw new Error("Veriler alınamadı");
      const data = await response.json();
      setCustomer(data.customer);
      setTransactions(data.transactions || []);
      setSummary(data.summary);
    } catch {
      toast.error("Müşteri bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(Number(val));
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Aktif", className: "bg-green-500 hover:bg-green-600" },
      POTENTIAL: { label: "Potansiyel", className: "bg-blue-500 hover:bg-blue-600" },
      INACTIVE: { label: "Pasif", className: "bg-gray-400 hover:bg-gray-500" },
      LOST: { label: "Kayıp", className: "bg-red-500 hover:bg-red-600" },
    };
    const s = map[status] || { label: status, className: "" };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (!customer || !summary) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        Müşteri bulunamadı
      </div>
    );
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/admin/accounting/customers" />

      <PageHeader
        title={customer.fullName}
        description={customer.club || "Cari Hesap Detayı"}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/accounting/customers/${customerId}/transactions`)
            }
          >
            <History className="mr-2 h-4 w-4" />
            Tüm Hareketler
          </Button>
        }
      />

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Borç</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(summary.totalDebit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Alacak</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalCredit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  summary.balance > 0 ? "bg-red-100" : summary.balance < 0 ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Wallet
                  className={`h-5 w-5 ${
                    summary.balance > 0
                      ? "text-red-600"
                      : summary.balance < 0
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Bakiye</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xl font-bold ${
                      summary.balance > 0
                        ? "text-red-600"
                        : summary.balance < 0
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(summary.balance))}
                  </p>
                  {summary.balance > 0 ? (
                    <Badge className="bg-red-500">Borçlu</Badge>
                  ) : summary.balance < 0 ? (
                    <Badge className="bg-green-500">Alacaklı</Badge>
                  ) : (
                    <Badge variant="outline">Sıfır</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Müşteri Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-24">Firma</span>
              <span className="font-medium">{customer.club || "-"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-24">Telefon</span>
              <span className="font-medium">{customer.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-24">Şehir</span>
              <span className="font-medium">
                {customer.city}
                {customer.district ? `, ${customer.district}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground w-24">Durum</span>
              {getStatusBadge(customer.status)}
            </div>
          </CardContent>
        </Card>

        {/* Hızlı Linkler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İlgili Sayfalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push(`/customers/${customerId}`)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Müşteri Detay Sayfası
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                router.push(
                  `/admin/accounting/customers/${customerId}/transactions`
                )
              }
            >
              <History className="mr-2 h-4 w-4" />
              Tüm Hareketler ({transactions.length})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Son Hareketler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Son Hareketler</CardTitle>
          {transactions.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  `/admin/accounting/customers/${customerId}/transactions`
                )
              }
            >
              Tümünü Gör
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Açıklama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    Henüz hareket yok
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                    <TableCell>
                      {t.debit && Number(t.debit) !== 0 ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Borç
                        </Badge>
                      ) : (
                        <Badge className="flex w-fit items-center gap-1 bg-green-600 hover:bg-green-700">
                          <ArrowLeft className="h-3 w-3" />
                          Alacak
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(Number(t.debit ?? t.credit ?? 0))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.description}
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
