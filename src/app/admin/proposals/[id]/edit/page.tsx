"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProposalEditForm } from "@/components/proposal-edit-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type ProposalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

type Proposal = {
  id: string
  title: string
  type: string
  description: string | null
  amount: string
  currency: string
  validUntil: string
  status: ProposalStatus
  notes: string | null
}

export default function EditProposalPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string
  
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`)
        if (!res.ok) throw new Error("Teklif bulunamadı")
        const data = await res.json()
        setProposal(data)
      } catch (error) {
        toast.error("Teklif yüklenemedi")
        router.push("/admin/proposals")
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [proposalId, router])

  const handleSuccess = () => {
    router.push("/admin/proposals")
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Yükleniyor...</div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">Teklif bulunamadı</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/proposals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tekliflere Dön
          </Button>
        </Link>
      </div>
      
      <ProposalEditForm
        proposalId={proposalId}
        initialData={{
          title: proposal.title,
          type: proposal.type,
          description: proposal.description || undefined,
          amount: proposal.amount,
          currency: proposal.currency,
          validUntil: proposal.validUntil.split('T')[0],
          status: proposal.status,
          notes: proposal.notes || undefined,
        }}
        onSuccess={handleSuccess}
        onCancel={() => router.push("/admin/proposals")}
      />
    </div>
  )
}
