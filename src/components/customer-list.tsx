"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomerListItem, PaginatedResponse } from "@/lib/types"
import { Search, Plus, Edit, Trash2, Eye, Users, Building2, Phone, MapPin, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"

interface CustomerListProps {
  onAddCustomer: () => void
  onEditCustomer: (customer: CustomerListItem) => void
  onViewCustomer: (customer: CustomerListItem) => void
  refreshTrigger?: number
}

export function CustomerList({ onAddCustomer, onEditCustomer, onViewCustomer, refreshTrigger }: CustomerListProps) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      })

      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data: PaginatedResponse<CustomerListItem> = await response.json()
      setCustomers(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchCustomers()
  }, [page, search, fetchCustomers, refreshTrigger])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }

      toast.success('Müşteri başarıyla silindi')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Müşteri silinirken hata oluştu')
    }
  }

  // Stats for the header
  const stats = {
    total: pagination.total,
    showing: customers.length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
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
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gösterilen</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.showing}</div>
            <p className="text-xs text-muted-foreground">Bu sayfada</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-500/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sayfa</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.page} <span className="text-sm font-normal text-muted-foreground">/ {pagination.totalPages}</span></div>
            <p className="text-xs text-muted-foreground">Toplam sayfa</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Müşteri Listesi</CardTitle>
              <CardDescription>Tüm müşterilerinizi görüntüleyin ve yönetin</CardDescription>
            </div>
            <Button onClick={onAddCustomer} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Müşteri Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Müşteri ara..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

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
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Ad Soyad
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Firma
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
                      <TableHead className="font-semibold text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{customer.fullName}</TableCell>
                        <TableCell>
                          {customer.club ? (
                            <Badge variant="secondary">{customer.club}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{customer.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          {customer.city && (
                            <div className="flex flex-col text-sm">
                              <span>{customer.city}</span>
                              {customer.district && (
                                <span className="text-muted-foreground text-xs">{customer.district}</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewCustomer(customer)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditCustomer(customer)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer.id)}
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

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Gösterilen <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> / <span className="font-medium">{pagination.total}</span> müşteri
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
        </CardContent>
      </Card>
    </div>
  )
}
