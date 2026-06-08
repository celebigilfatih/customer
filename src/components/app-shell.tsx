"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, Bell, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar = pathname === "/login"

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex bg-background text-foreground">
        {hideSidebar ? null : (
          <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
            <div className="p-4 border-b border-border">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">MT</span>
                </div>
                <span className="text-lg font-semibold">Müşteri Takip</span>
              </Link>
            </div>
            <ScrollArea className="flex-1 px-3 py-4">
              <Sidebar />
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin</span>
                  <span className="text-xs text-muted-foreground">admin@musteritakip.com</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {hideSidebar ? null : (
            <header className="sticky top-0 z-30 border-b border-border bg-white">
              <div className="flex items-center gap-4 px-4 h-14">
                <div className="md:hidden">
                  <MobileSidebar />
                </div>
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Müşteri Takip Sistemi</span>
                </div>
                <div className="flex-1 flex justify-center max-w-2xl mx-auto">
                  <div className="relative w-full max-w-md hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <ThemeToggle />
                </div>
              </div>
            </header>
          )}

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}

function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MT</span>
            </div>
            <span className="text-lg font-semibold">Müşteri Takip</span>
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)] px-3 py-4">
          <Sidebar />
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">admin@musteritakip.com</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
