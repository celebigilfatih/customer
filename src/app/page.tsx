<<<<<<< HEAD
"use client"

import { useRouter } from "next/navigation"
import { CustomerList } from "@/components/customer-list"
import { Button } from "@/components/ui/button"
import { CustomerListItem } from "@/lib/types"
import { Plus, LogOut, Users } from "lucide-react"
import { routes } from "@/lib/routes"

export default function HomePage() {
  const router = useRouter()

  const handleAddCustomer = () => {
    router.push(routes.customers.add)
  }

  const handleEditCustomer = (customer: CustomerListItem) => {
    router.push(routes.customers.edit(customer.id))
  }

  const handleViewCustomer = (customer: CustomerListItem) => {
    router.push(routes.customers.detail(customer.id))
  }

  const handleLogout = () => {
    // Clear authentication cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push(routes.login)
  }
=======
import Link from "next/link";
import { Trophy, Users, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
>>>>>>> 3e3797c3baed7fa069b92dfdf0f0b4f0ac8fc26d

export default function Home() {
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Müşteri Takip Sistemi</h1>
              <p className="text-gray-600 mt-1">
                Müşterilerinizi yönetin ve bilgilerini etkili bir şekilde takip edin
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push(routes.users.list)} size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Users className="w-5 h-5 mr-2" />
                Kullanıcılar
              </Button>
              <Button onClick={handleAddCustomer} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Müşteri Ekle
              </Button>
              <Button onClick={handleLogout} size="lg" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>

     
            <CustomerList
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onViewCustomer={handleViewCustomer}
            />
      </div>
    </div>
  )
}
=======
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Trophy className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Turnuva Yönetim Sistemi
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Turnuva katılım başvurularını yönetin, takım bilgilerini düzenleyin ve 
          tüm süreci tek bir platformdan kontrol edin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/basvuru" className="cursor-pointer">
            <Button size="lg" className="w-full sm:w-auto">
              <FileText className="mr-2 h-5 w-5" />
              Başvuru Yap
            </Button>
          </Link>
          <Link href="/takimlar" className="cursor-pointer">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Users className="mr-2 h-5 w-5" />
              Katılımcı Takımları Görüntüle
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Kolay Başvuru
            </CardTitle>
            <CardDescription>
              Takımınızın turnuvaya katılım başvurusunu hızlı ve kolay bir şekilde yapın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Takım adı ve hoca bilgileri</li>
              <li>• İletişim bilgileri</li>
              <li>• Açıklama ve notlar</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-600" />
              Takım Yönetimi
            </CardTitle>
            <CardDescription>
              Onaylanmış takımları görüntüleyin ve detaylı bilgilere erişin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Etap bazlı filtreleme</li>
              <li>• Yaş grubu seçimi</li>
              <li>• Takım logoları</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
              Yönetici Paneli
            </CardTitle>
            <CardDescription>
              Başvuruları onaylayın, takım bilgilerini düzenleyin ve istatistikleri görüntüleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Başvuru onay/red işlemleri</li>
              <li>• Takım bilgisi düzenleme</li>
              <li>• Katılım istatistikleri</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Turnuva İstatistikleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Toplam Başvuru</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Onaylanan Takım</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-gray-600">Bekleyen Başvuru</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Aktif Etap</div>
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 3e3797c3baed7fa069b92dfdf0f0b4f0ac8fc26d
