"use client"

import { useRouter } from "next/navigation"
import { TaskForm } from "@/components/task-form"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function AdminTaskAddPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Görev"
        description="Yeni bir görev veya müşteri talebi oluşturun"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Görev ve Talepler", href: '/admin/tasks' },
          { label: "Yeni Görev" },
        ]}
      />
      <TaskForm embedded onCancel={() => router.push('/admin/tasks')} onSuccess={() => router.push('/admin/tasks')} />
    </div>
  )
}
