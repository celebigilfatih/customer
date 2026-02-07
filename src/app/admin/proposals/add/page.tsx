"use client"

import { ProposalForm } from "@/components/proposal-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AddProposalPage() {
  const handleSuccess = () => {
    window.location.href = "/admin/proposals"
  }

  const handleCancel = () => {
    window.location.href = "/admin/proposals"
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/proposals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Don
          </Button>
        </Link>
      </div>
      <ProposalForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
