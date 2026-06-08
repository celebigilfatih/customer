"use client"

import { useRouter } from "next/navigation"
import { DomainForm } from "@/components/domain-form"

export default function AdminDomainAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Domain</h1>
      <DomainForm embedded onCancel={() => router.push('/admin/domains')} onSuccess={() => router.push('/admin/domains')} />
    </div>
  )
}
