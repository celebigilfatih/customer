"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomerListItem, PaginatedResponse } from "@/lib/types"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

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

  // Utility functions (not used but kept for potential future use)
  const formatPrice = (price: string | number | null) => {
    if (!price) return '-'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(Number(price))
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('tr-TR')
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Müşteri ara..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <Button 
              onClick={onAddCustomer} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Müşteri
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Müşteriler yükleniyor...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Müşteri bulunamadı</p>
              <p className="text-gray-400 text-sm mt-1">Yeni müşteri eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Ad Soyad</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kulüp</TableHead>
                      <TableHead className="font-semibold text-gray-700">İl</TableHead>
                      <TableHead className="font-semibold text-gray-700">İlçe</TableHead>
                      <TableHead className="font-semibold text-gray-700">Teklif</TableHead>
                      <TableHead className="font-semibold text-gray-700">Başlangıç Tarihi</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        <TableCell className="font-medium text-gray-900">{customer.fullName}</TableCell>
                        <TableCell className="text-gray-700">{customer.club}</TableCell>
                        <TableCell className="text-gray-700">{customer.city}</TableCell>
                        <TableCell className="text-gray-700">{customer.district}</TableCell>
                        <TableCell className={`font-semibold text-green-600`}>
                          {customer.offer ? `${customer.offer} TL` : 'Belirtilmemiş'}
                        </TableCell>
                        <TableCell className="text-gray-600">{customer.startDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewCustomer(customer)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditCustomer(customer)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Gösterilen {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} müşteri
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    Önceki
                  </Button>
                  <span className="text-sm text-gray-600 px-3">
                    Sayfa {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="border-gray-200 hover:bg-gray-50"
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