"use client"

import { useRouter } from "next/navigation"
import { HostingForm } from "@/components/hosting-form"

export default function AdminHostingAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Hosting</h1>
      <HostingForm embedded onCancel={() => router.push('/admin/hosting')} onSuccess={() => router.push('/admin/hosting')} />
    </div>
  )
}
