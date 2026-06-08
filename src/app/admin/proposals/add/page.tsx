"use client"

import { ProposalForm } from "@/components/proposal-form"
import { useRouter } from "next/navigation"

export default function AddProposalPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Teklif</h1>
      <ProposalForm 
        embedded
        onSuccess={() => router.push("/admin/proposals")} 
        onCancel={() => router.push("/admin/proposals")} 
      />
    </div>
  )
}
