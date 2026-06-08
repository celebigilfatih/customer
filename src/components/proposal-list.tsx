"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Download, Trash2, Plus, Pencil } from "lucide-react"
import Link from "next/link"
import type { PaginatedResponse } from "@/lib/types"
import { getProposalTypes } from "@/lib/settings-client"

type Proposal = {
  id: string
  title: string
  type: string
  amount: string
  currency: string
  status: string
  validUntil: string
  createdAt: string
  customer: {
    id: string
    fullName: string
    club: string
  }
}

interface ProposalListProps {
  onRefresh?: () => void
  showActions?: boolean
  customerId?: string
}

export function ProposalList({ onRefresh, showActions = true, customerId }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [proposalTypes, setProposalTypes] = useState<{ id: string; name: string; label: string }[]>([])

  useEffect(() => {
    const loadProposalTypes = async () => {
      try {
        const types = await getProposalTypes()
        setProposalTypes(types)
      } catch (error) {
        console.error("Failed to load proposal types:", error)
      }
    }

    loadProposalTypes()
  }, [])

  const fetchProposals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
        ...(status !== "all" && { status }),
        ...(type !== "all" && { type }),
        ...(customerId && { customerId }),
      })
      const res = await fetch(`/api/proposals?${params}`)
      if (!res.ok) throw new Error()
      const data: PaginatedResponse<Proposal> = await res.json()
      setProposals(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error("Failed to fetch proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [page, status, type, customerId])

  useEffect(() => {
    if (search) {
      const debounce = setTimeout(() => {
        setPage(1)
        fetchProposals()
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      fetchProposals()
    }
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm("Bu teklifi silmek istediğinizden emin misiniz?")) return
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      fetchProposals()
      onRefresh?.()
    } catch (error) {
      console.error("Failed to delete proposal:", error)
    }
  }

  const getTypeLabel = (typeName: string) => {
    const type = proposalTypes.find(t => t.name === typeName)
    return type ? type.label : typeName
  }

  const typeLabels: Record<string, string> = {
    SUBSCRIPTION: "Abonelik",
    PROJECT: "Proje",
    MAINTENANCE: "Bakım Anlaşması",
    RENEWAL: "Yenileme",
  }

  const statusLabels: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Taslak", className: "bg-gray-100 text-gray-700" },
    PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Onaylandı", className: "bg-green-100 text-green-700" },
    REJECTED: { label: "Reddedildi", className: "bg-red-100 text-red-700" },
    EXPIRED: { label: "Süresi Doldu", className: "bg-gray-200 text-gray-500" },
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teklifler
        </CardTitle>
        {showActions && (
          <Link href="/admin/proposals/add">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Teklif
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="DRAFT">Taslak</SelectItem>
              <SelectItem value="PENDING">Beklemede</SelectItem>
              <SelectItem value="APPROVED">Onaylandı</SelectItem>
              <SelectItem value="REJECTED">Reddedildi</SelectItem>
              <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="SUBSCRIPTION">Abonelik</SelectItem>
              <SelectItem value="PROJECT">Proje</SelectItem>
              <SelectItem value="MAINTENANCE">Bakım Anlaşması</SelectItem>
              <SelectItem value="RENEWAL">Yenileme</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Teklif bulunamadı</div>
        ) : (
          <>
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{proposal.title}</span>
                      <Badge variant="outline">{getTypeLabel(proposal.type)}</Badge>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusLabels[proposal.status]?.className}`}>
                        {statusLabels[proposal.status]?.label}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {proposal.customer.fullName}
                      {proposal.customer.club && ` • ${proposal.customer.club}`}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {parseInt(proposal.amount).toLocaleString("tr-TR", {
                        style: "currency",
                        currency: proposal.currency,
                      })}
                      {" • "}
                      Geçerlilik: {new Date(proposal.validUntil).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/proposals/${proposal.id}`}>
                      <Button variant="ghost" size="icon" title="Görüntüle">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/proposals/${proposal.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Düzenle">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" title="İndir">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    {showActions && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Sil"
                        onClick={() => handleDelete(proposal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Sayfa {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
