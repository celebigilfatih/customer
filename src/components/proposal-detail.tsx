"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Check, X, FileText, Package } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getProposalTypes } from "@/lib/settings-client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ProposalItem = {
  id: string
  description: string
  quantity: string
  unitPrice: string
  totalPrice: string
  product: {
    id: string
    name: string
    code: string | null
  } | null
}

type Proposal = {
  id: string
  number: string
  title: string
  type: string
  description: string | null
  amount: string
  currency: string
  validUntil: string
  status: string
  notes: string | null
  createdAt: string
  approvedAt: string | null
  items: ProposalItem[]
  customer: {
    id: string
    fullName: string
    club: string | null
    phoneNumber: string | null
    city: string | null
    district: string | null
    address: string | null
  }
}

interface ProposalDetailProps {
  proposalId: string
  onApprove?: () => void
  onReject?: () => void
  showActions?: boolean
}

export function ProposalDetail({ proposalId, onApprove, onReject, showActions = true }: ProposalDetailProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [notes, setNotes] = useState("")
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

  const fetchProposal = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProposal(data)
      setNotes(data.notes || "")
    } catch (error) {
      console.error("Failed to fetch proposal:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", notes }),
      })
      if (!res.ok) throw new Error()
      toast.success("Teklif onaylandı")
      fetchProposal()
      onApprove?.()
    } catch {
      toast.error("Onay işlemi başarısız")
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", notes }),
      })
      if (!res.ok) throw new Error()
      toast.success("Teklif reddedildi")
      fetchProposal()
      onReject?.()
    } catch {
      toast.error("Red işlemi başarısız")
    } finally {
      setRejecting(false)
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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
  }

  if (!proposal) {
    return <div className="text-center py-8 text-muted-foreground">Teklif bulunamadı</div>
  }

  const canTakeAction = showActions && proposal.status === "PENDING"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/proposals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{proposal.title}</h1>
          <p className="text-muted-foreground">
            {proposal.customer.fullName}
            {proposal.customer.club && ` • ${proposal.customer.club}`}
          </p>
        </div>
        <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            İndir
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Teklif Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Teklif Türü</p>
                  <p className="font-medium">{getTypeLabel(proposal.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <Badge className={statusLabels[proposal.status]?.className}>
                    {statusLabels[proposal.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geçerlilik Tarihi</p>
                  <p className="font-medium">
                    {new Date(proposal.validUntil).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oluşturulma</p>
                  <p className="font-medium">
                    {new Date(proposal.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>

              {proposal.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                  <p className="whitespace-pre-wrap">{proposal.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Teklif Tutarı</p>
                <p className="text-3xl font-bold text-blue-600">
                  {parseInt(proposal.amount).toLocaleString("tr-TR", {
                    style: "currency",
                    currency: proposal.currency,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Items */}
          {proposal.items && proposal.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Teklif Kalemleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Ürün</TableHead>
                        <TableHead className="font-semibold w-24 text-right">Miktar</TableHead>
                        <TableHead className="font-semibold w-32 text-right">Birim Fiyat</TableHead>
                        <TableHead className="font-semibold w-32 text-right">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposal.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product?.name || item.description}</p>
                              {item.product?.code && (
                                <p className="text-xs text-muted-foreground">Kod: {item.product.code}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {parseFloat(item.unitPrice).toLocaleString("tr-TR", {
                              style: "currency",
                              currency: proposal.currency,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {parseFloat(item.totalPrice).toLocaleString("tr-TR", {
                              style: "currency",
                              currency: proposal.currency,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {canTakeAction && (
            <Card>
              <CardHeader>
                <CardTitle>Onay / Red</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notlar (Opsiyonel)</p>
                  <Textarea
                    placeholder="Onay veya red sebebini girin..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={approving || rejecting}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {approving ? "Onaylanıyor..." : "Onayla"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                    disabled={approving || rejecting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {rejecting ? "Reddediliyor..." : "Reddet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {proposal.notes && !canTakeAction && (
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{proposal.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Ad Soyad</p>
                <p className="font-medium">{proposal.customer.fullName}</p>
              </div>
              {proposal.customer.club && (
                <div>
                  <p className="text-sm text-muted-foreground">Kulüp/Firma</p>
                  <p className="font-medium">{proposal.customer.club}</p>
                </div>
              )}
              {proposal.customer.phoneNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{proposal.customer.phoneNumber}</p>
                </div>
              )}
              {proposal.customer.city && (
                <div>
                  <p className="text-sm text-muted-foreground">Konum</p>
                  <p className="font-medium">
                    {proposal.customer.city} / {proposal.customer.district}
                  </p>
                </div>
              )}
              {proposal.customer.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Adres</p>
                  <p className="font-medium text-sm">{proposal.customer.address}</p>
                </div>
              )}
              <Link href={`/admin/customers/${proposal.customer.id}`}>
                <Button variant="outline" className="w-full mt-2">
                  Müşteri Sayfası
                </Button>
              </Link>
            </CardContent>
          </Card>

          {proposal.approvedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Onay Bilgisi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Onay Tarihi</p>
                <p className="font-medium">
                  {new Date(proposal.approvedAt).toLocaleDateString("tr-TR")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
