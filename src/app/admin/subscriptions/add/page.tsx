"use client"

import { useRouter } from "next/navigation"
import { SubscriptionForm } from "@/components/subscription-form"

export default function AdminSubscriptionAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Abonelik</h1>
      <SubscriptionForm embedded onCancel={() => router.push('/admin/subscriptions')} onSuccess={() => router.push('/admin/subscriptions')} />
    </div>
  )
}
