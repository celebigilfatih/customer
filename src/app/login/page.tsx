"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/routes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre boş bırakılamaz")
      setIsLoading(false)
      return
    }

    try {
      // API call to authenticate user
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        document.cookie = `auth-token=${data.user.id}; path=/; max-age=86400`
        document.cookie = `role=${data.user.role}; path=/; max-age=86400`
        if (data.user.role === 'ADMIN' || data.user.role === 'SUPPORT') {
          router.push(routes.admin.dashboard)
        } else {
          router.push(routes.portal.dashboard)
        }
      } else {
        setError(data.error || "Geçersiz kullanıcı adı veya şifre")
      }
    } catch (err) {
      console.error('Login error:', err)
      setError("Giriş yapılırken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#151517] text-white lg:flex">
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(15,15,16,.9))]" />
          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-base font-bold text-[#151517]">
                MT
              </div>
              <div>
                <p className="text-base font-semibold leading-none">Müşteri Takip</p>
                <p className="mt-1 text-xs text-white/55">Operasyon paneli</p>
              </div>
            </div>

            <div className="max-w-xl space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal xl:text-6xl">
                  İş akışlarını tek panelden yönetin.
                </h1>
                <p className="max-w-md text-base leading-7 text-white/68">
                  Müşteri, satış, tahsilat ve süreli hizmet kayıtlarına güvenli erişim.
                </p>
              </div>

              <div className="grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-md border border-white/12 bg-white/[0.06] p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/45">Kapsam</p>
                  <p className="mt-2 text-sm font-medium text-white">Admin ve portal</p>
                </div>
                <div className="rounded-md border border-white/12 bg-white/[0.06] p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/45">Oturum</p>
                  <p className="mt-2 text-sm font-medium text-white">Rol tabanlı erişim</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/58">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span>Yetkili kullanıcılar için güvenli giriş</span>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                MT
              </div>
              <div>
                <p className="text-base font-semibold leading-none">Müşteri Takip</p>
                <p className="mt-1 text-xs text-muted-foreground">Operasyon paneli</p>
              </div>
            </div>

            <Card className="gap-0 rounded-lg border bg-white py-0 shadow-[0_24px_80px_rgba(16,24,40,0.10)]">
              <CardHeader className="border-b px-6 py-6">
                <CardTitle className="text-2xl font-semibold tracking-normal">
                  Hesabınıza giriş yapın
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  Devam etmek için kullanıcı bilgilerinizi girin.
                </p>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="rounded-md border-destructive/20 bg-destructive/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Kullanıcı adı
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Kullanıcı adınızı girin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-11 rounded-md bg-white pl-10 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Şifre
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Şifrenizi girin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-md bg-white pl-10 pr-11 text-sm"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-md text-sm font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Giriş yap"}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Erişim problemi yaşıyorsanız sistem yöneticinizle iletişime geçin.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
