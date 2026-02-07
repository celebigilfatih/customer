"use client"

import { useRouter } from "next/navigation"
import { PaymentForm } from "@/components/payment-form"

export default function AdminFinanceAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Ödeme</h1>
      <PaymentForm embedded onCancel={() => router.push('/admin/finance')} onSuccess={() => router.push('/admin/finance')} />
    </div>
  )
}
