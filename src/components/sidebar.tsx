"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Users, Home, LogOut, Globe, Server, Repeat, ClipboardList, 
  Wallet, BarChart3, Webhook, Ticket, User, FileText, 
  ChevronRight, LayoutDashboard, Settings, CreditCard, 
  Briefcase, LineChart, Bell, Package, Calculator, Receipt
} from "lucide-react"
import { routes } from "@/lib/routes"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

type NavSection = {
  title: string
  icon: React.ReactNode
  items: NavItem[]
  collapsible?: boolean
}

function getSections(pathname: string): NavSection[] {
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/customers") || pathname.startsWith("/subscriptions") || pathname.startsWith("/domains") || pathname.startsWith("/hostings") || pathname.startsWith("/finance") || pathname.startsWith("/tasks") || pathname.startsWith("/users")
  const isPortal = pathname.startsWith("/portal")

  if (isAdmin) {
    const adminSections: NavSection[] = [
      {
        title: "Ana Menü",
        icon: <LayoutDashboard className="h-4 w-4" />,
        items: [
          { label: "Genel Bakış", href: routes.admin.dashboard, icon: <Home className="h-4 w-4" /> },
          { label: "Müşteri Listesi", href: routes.admin.customers, icon: <Users className="h-4 w-4" /> },
        ],
      },
      {
        title: "Hizmetler",
        icon: <Briefcase className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Abonelikler", href: routes.admin.subscriptions, icon: <Repeat className="h-4 w-4" /> },
          { label: "Domainler", href: routes.admin.domains, icon: <Globe className="h-4 w-4" /> },
          { label: "Hostingler", href: routes.admin.hosting, icon: <Server className="h-4 w-4" /> },
        ],
      },
      {
        title: "Muhasebe",
        icon: <Calculator className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Cari Hesaplar", href: "/admin/accounting/customers", icon: <Users className="h-4 w-4" /> },
          { label: "Faturalar", href: "/admin/invoices", icon: <Receipt className="h-4 w-4" /> },
          { label: "Tahsilatlar", href: "/admin/payments", icon: <CreditCard className="h-4 w-4" /> },
        ],
      },
      {
        title: "Stok",
        icon: <Package className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Ürünler", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
        ],
      },
      {
        title: "İşlemler",
        icon: <ClipboardList className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Teklifler", href: routes.admin.proposals, icon: <FileText className="h-4 w-4" /> },
          { label: "Görev ve Talepler", href: routes.admin.tasks, icon: <ClipboardList className="h-4 w-4" /> },
        ],
      },
      {
        title: "Finans",
        icon: <CreditCard className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Finans Yönetimi", href: routes.admin.finance, icon: <Wallet className="h-4 w-4" /> },
          { label: "Raporlar", href: routes.admin.reports, icon: <BarChart3 className="h-4 w-4" /> },
        ],
      },
      {
        title: "Kullanıcılar",
        icon: <User className="h-4 w-4" />,
        items: [
          { label: "Kullanıcı Listesi", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
        ],
      },
      {
        title: "Ayarlar",
        icon: <Settings className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Teklif Türleri", href: "/admin/settings/proposal-types", icon: <FileText className="h-4 w-4" /> },
          { label: "Webhooklar", href: routes.admin.settings.webhooks, icon: <Webhook className="h-4 w-4" /> },
        ],
      },
    ]
    return adminSections
  }

  if (isPortal) {
    const portalSections: NavSection[] = [
      {
        title: "Ana Menü",
        icon: <LayoutDashboard className="h-4 w-4" />,
        items: [
          { label: "Genel Bakış", href: routes.portal.dashboard, icon: <Home className="h-4 w-4" /> },
        ],
      },
      {
        title: "Hizmetlerim",
        icon: <Briefcase className="h-4 w-4" />,
        collapsible: true,
        items: [
          { label: "Aboneliklerim", href: routes.portal.subscriptions, icon: <Repeat className="h-4 w-4" /> },
          { label: "Domainlerim", href: routes.portal.domains, icon: <Globe className="h-4 w-4" /> },
          { label: "Hostinglerim", href: routes.portal.hosting, icon: <Server className="h-4 w-4" /> },
        ],
      },
      {
        title: "İşlemler",
        icon: <ClipboardList className="h-4 w-4" />,
        items: [
          { label: "Tekliflerim", href: routes.portal.proposals, icon: <FileText className="h-4 w-4" /> },
          { label: "Talepler", href: routes.portal.tickets, icon: <Ticket className="h-4 w-4" /> },
        ],
      },
      {
        title: "Hesap",
        icon: <User className="h-4 w-4" />,
        items: [
          { label: "Profil", href: routes.portal.profile, icon: <User className="h-4 w-4" /> },
        ],
      },
    ]
    return portalSections
  }

  const siteSections: NavSection[] = [
    {
      title: "Müşteriler",
      icon: <Users className="h-4 w-4" />,
      items: [
        { label: "Liste", href: routes.customers.list, icon: <Users className="h-4 w-4" /> },
      ],
    },
  ]

  return siteSections
}

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="hidden lg:block">
          {item.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function SectionHeader({ 
  section, 
  isOpen, 
  onToggle,
  hasActiveItem 
}: { 
  section: NavSection; 
  isOpen: boolean; 
  onToggle: () => void;
  hasActiveItem: boolean;
}) {
  if (!section.collapsible) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {section.icon}
        <span>{section.title}</span>
      </div>
    )
  }

  return (
    <CollapsibleTrigger asChild>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActiveItem ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span>{section.title}</span>
        </div>
        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
      </button>
    </CollapsibleTrigger>
  )
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const [openSections, setOpenSections] = React.useState<string[]>(["Ana Menü", "Hizmetler", "Muhasebe", "Stok", "İşlemler", "Finans", "Ayarlar"])

  const isActive = (href: string) => pathname === href

  const toggleSection = (title: string) => {
    setOpenSections(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push(routes.login)
  }

  const sections = getSections(pathname)

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col h-full gap-1">
        <div className="flex-1 space-y-4">
          {sections.map((section) => {
            const isOpen = openSections.includes(section.title)
            const hasActiveItem = section.items.some(item => isActive(item.href))
            
            if (section.collapsible) {
              return (
                <Collapsible
                  key={section.title}
                  open={isOpen}
                  onOpenChange={() => toggleSection(section.title)}
                  className="space-y-1"
                >
                  <SectionHeader 
                    section={section} 
                    isOpen={isOpen} 
                    onToggle={() => toggleSection(section.title)}
                    hasActiveItem={hasActiveItem}
                  />
                  <CollapsibleContent className="space-y-0.5 pl-2">
                    {section.items.map((item) => (
                      <NavItemLink 
                        key={item.label} 
                        item={item} 
                        isActive={isActive(item.href)} 
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <div key={section.title} className="space-y-1">
                <SectionHeader 
                  section={section} 
                  isOpen={true}
                  onToggle={() => {}}
                  hasActiveItem={hasActiveItem}
                />
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItemLink 
                      key={item.label} 
                      item={item} 
                      isActive={isActive(item.href)} 
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        <Separator className="my-2" />
        
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>Çıkış Yap</span>
        </button>
      </nav>
    </TooltipProvider>
  )
}
