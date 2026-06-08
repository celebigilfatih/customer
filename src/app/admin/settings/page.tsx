"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Settings, Webhook, ChevronRight } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { routes } from "@/lib/routes"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Sistem ayarlarını yapılandırın ve yönetin"
        breadcrumbs={[
          { label: "Admin", href: routes.admin.root },
          { label: "Ayarlar" },
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/settings/proposal-types">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Teklif Türleri</CardTitle>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Teklif türlerini yönetin ve yeni türler ekleyin
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/settings/webhooks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Webhook className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">Webhooklar</CardTitle>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Webhook entegrasyonlarını yapılandırın
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-gray-600" />
                </div>
                <CardTitle className="text-base">Genel Ayarlar</CardTitle>
              </div>
            </div>
            <CardDescription>
              Uygulama genel ayarlarını yapılandırın (Yakında)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
