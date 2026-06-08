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
import { ArrowRight, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  debit?: { toNumber?(): number } | number | null;
  credit?: { toNumber?(): number } | number | null;
  balance: number;
  description: string;
  proposal?: { number: string; title: string } | null;
  invoice?: { number: string } | null;
  payment?: { type: string; date: string } | null;
  createdAt: string;
}

interface CustomerInfo {
  id: string;
  fullName: string;
  currentBalance: string;
}

export default function CustomerTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<{ totalDebit: number; totalCredit: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/accounting/customers/${customerId}`);
      if (!response.ok) throw new Error("Müşteri bilgisi alınamadı");

      const data = await response.json();
      setCustomer({
        id: data.customer.id,
        fullName: data.customer.fullName,
        currentBalance: data.summary.balance.toString(),
      });
      setTransactions(data.transactions || []);
      setSummary(data.summary);
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(num);
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

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/admin/accounting/customers" />

      <PageHeader
        title="Cari Hareketler"
        description={customer?.fullName || "Müşteri işlemleri"}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/accounting/customers/${customerId}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Detay
          </Button>
        }
      />

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Müşteri Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Müşteri Adı</p>
                <p className="text-lg font-semibold">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bakiye</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold font-mono">
                    {formatBalance(customer.currentBalance)}
                  </p>
                  {parseFloat(customer.currentBalance) > 0 ? (
                    <Badge className="bg-red-500">Borçlu</Badge>
                  ) : parseFloat(customer.currentBalance) < 0 ? (
                    <Badge className="bg-green-500">Alacaklı</Badge>
                  ) : (
                    <Badge variant="outline">Sıfır</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Tutar</TableHead>
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
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    İşlem bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
            <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      {transaction.debit && transaction.debit !== 0 ? (
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
                      {formatBalance(
                        (transaction.debit ?? transaction.credit ?? 0).toString()
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.proposal ? (
                        <span>{transaction.proposal.number}</span>
                      ) : transaction.invoice ? (
                        <span>{transaction.invoice.number}</span>
                      ) : (
                        "-"
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
