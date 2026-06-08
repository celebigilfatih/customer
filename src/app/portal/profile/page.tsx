"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { routes } from "@/lib/routes"

type UserInfo = { id: string; username: string; fullName: string | null; email: string | null }

function getPortalUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    const u = JSON.parse(raw) as { id: string; username: string; fullName?: string | null; email?: string | null }
    return { id: u.id, username: u.username, fullName: u.fullName || null, email: u.email || null }
  } catch {
    return null
  }
}

export default function PortalProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const u = getPortalUser()
    setUser(u)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 items-center">
        <BackButton size="sm" fallbackHref={routes.portal.dashboard} className="hover:bg-gray-100" />
        <div className="col-span-3">
          <h1 className="text-2xl font-bold">Profil</h1>
        </div>
      </div>
      <Card className="border">
        <CardHeader>
          <CardTitle>Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Kullanıcı adı</span><span className="font-semibold">{user.username}</span></div>
              <div className="flex items-center justify-between"><span>Ad Soyad</span><span className="font-semibold">{user.fullName || '-'}</span></div>
              <div className="flex items-center justify-between"><span>E-posta</span><span className="font-semibold">{user.email || '-'}</span></div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Kullanıcı bilgisi bulunamadı</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
