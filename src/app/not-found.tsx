import Link from "next/link"
import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-3xl font-bold">Sayfa bulunamadı</h1>
      <p className="text-gray-600">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href={routes.dashboard}><Button variant="outline">Ana Sayfa</Button></Link>
        <Link href={routes.login}><Button variant="outline">Giriş</Button></Link>
        <Link href={routes.admin.dashboard}><Button variant="outline">Admin</Button></Link>
        <Link href={routes.portal.dashboard}><Button variant="outline">Müşteri Paneli</Button></Link>
      </div>
    </div>
  )
}
