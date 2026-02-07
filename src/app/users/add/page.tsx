'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BackButton } from '@/components/back-button'

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kullanıcı oluşturulamadı')
      }

      router.push(routes.users.list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-4 items-center mb-4">
            <BackButton size="sm" fallbackHref={routes.users.list} className="hover:bg-gray-100" />
            <div className="col-span-3">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
                Yeni Kullanıcı Ekle
              </h1>
              <p className="text-muted-foreground text-lg">
                Kullanıcı bilgilerini girin
              </p>
            </div>
          </div>
        </div>

        <Card className="border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı *</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Kullanıcı adı giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Ad ve soyad giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="E-posta adresi giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Şifre giriniz"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Kullanıcı aktif mi?
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(routes.users.list)}
                  disabled={loading}
                  className="flex-1 border-gray-200 hover:bg-gray-50"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
