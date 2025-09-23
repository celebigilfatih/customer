"use client"

import { useRouter } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function AddCustomerPage() {
  const router = useRouter()

  const handleSuccess = () => {
    toast.success("Müşteri başarıyla oluşturuldu!")
    router.push("/")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">
            Yeni Müşteri Ekle
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Yeni müşteri bilgilerini girin
          </p>
        </div>

        <CustomerForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}