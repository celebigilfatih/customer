"use client"

import { useRouter } from "next/navigation"
import { Plus, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { TaskList } from "@/components/task-list"
import { PageHeader } from "@/components/page-header"

export default function AdminTasksPage() {
  const router = useRouter()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Görev ve Talepler"
        description="Görevleri ve müşteri taleplerini yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Görev ve Talepler" },
        ]}
        actions={
          <Button onClick={() => router.push('/admin/tasks/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Görev
          </Button>
        }
      />
      <TaskList onAdd={() => router.push('/admin/tasks/add')} />
    </div>
  )
}
