"use client"

import { ProposalForm } from "@/components/proposal-form"
import { ArrowLeft, FileText } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50">
      {/* Modern Header */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/proposals">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Geri
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Yeni Teklif Oluştur</h1>
                  <p className="text-sm text-muted-foreground">Müşteri için yeni teklif hazırlayın</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <ProposalForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
