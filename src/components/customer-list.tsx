"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerListItem, PaginatedResponse } from "@/lib/types";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

interface CustomerListProps {
  onAddCustomer: () => void;
  onEditCustomer: (customer: CustomerListItem) => void;
  onViewCustomer: (customer: CustomerListItem) => void;
  refreshTrigger?: number;
}

export function CustomerList({
  onAddCustomer,
  onEditCustomer,
  onViewCustomer,
  refreshTrigger,
}: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data: PaginatedResponse<CustomerListItem> = await response.json();
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [page, search, fetchCustomers, refreshTrigger]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      toast.success("Müşteri başarıyla silindi");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Müşteri silinirken hata oluştu");
    }
  };

  const pageStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-background px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {pagination.total} müşteri
              </div>
              <div className="text-xs text-muted-foreground">
                {search
                  ? "Arama sonuçları listeleniyor"
                  : "Kayıtlar yeniden eskiye sıralı"}
              </div>
            </div>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Müşteri, şehir veya ilçe ara..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        <div className="p-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Müşteri bulunamadı"
              description="Arama kriterlerinize uygun müşteri bulunmuyor veya henüz müşteri eklenmemiş."
              action={
                <Button onClick={onAddCustomer}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Müşteri Ekle
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Müşteri
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Telefon
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Konum
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const companyName = customer.club?.trim();
                      const shouldShowCompany =
                        companyName &&
                        companyName.localeCompare(
                          customer.fullName.trim(),
                          "tr",
                          { sensitivity: "base" },
                        ) !== 0;

                      return (
                        <TableRow
                          key={customer.id}
                          className="hover:bg-muted/30"
                        >
                          <TableCell className="py-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-medium leading-5">
                                  {customer.fullName}
                                </div>
                                {shouldShowCompany && (
                                  <div className="truncate text-sm text-muted-foreground">
                                    {companyName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {customer.phoneNumber || "-"}
                          </TableCell>
                          <TableCell>
                            {customer.city || customer.district ? (
                              <div className="flex flex-col text-sm leading-5">
                                {customer.city && <span>{customer.city}</span>}
                                {customer.district && (
                                  <span className="text-xs text-muted-foreground">
                                    {customer.district}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewCustomer(customer)}
                                className="h-8 w-8"
                                aria-label={`${customer.fullName} detayını görüntüle`}
                                title="Detay"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditCustomer(customer)}
                                className="h-8 w-8"
                                aria-label={`${customer.fullName} kaydını düzenle`}
                                title="Düzenle"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(customer.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                aria-label={`${customer.fullName} kaydını sil`}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {pageStart} - {pageEnd}
                  </span>{" "}
                  / <span className="font-medium">{pagination.total}</span>{" "}
                  müşteri
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Sayfa {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
