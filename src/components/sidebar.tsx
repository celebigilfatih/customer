"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users, Home, LogOut, Globe, Server, Repeat, ClipboardList,
  BarChart3, Webhook, Ticket, User, FileText,
  LayoutDashboard, Settings, CreditCard,
  Briefcase, Package, Calculator, Receipt, ShoppingCart, Truck, ChevronDown,
} from "lucide-react"
import { routes } from "@/lib/routes"
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
        title: "Süreli Hizmetler",
        icon: <Briefcase className="h-4 w-4" />,
        items: [
          { label: "Abonelikler", href: routes.admin.subscriptions, icon: <Repeat className="h-4 w-4" /> },
          { label: "Domainler", href: routes.admin.domains, icon: <Globe className="h-4 w-4" /> },
          { label: "Hostingler", href: routes.admin.hosting, icon: <Server className="h-4 w-4" /> },
        ],
      },
      {
        title: "Muhasebe",
        icon: <Calculator className="h-4 w-4" />,
        items: [
          { label: "Faturalar", href: "/admin/invoices", icon: <Receipt className="h-4 w-4" /> },
          { label: "Tahsilatlar", href: "/admin/finance", icon: <CreditCard className="h-4 w-4" /> },
          { label: "Tedarikçiler", href: routes.admin.suppliers, icon: <Truck className="h-4 w-4" /> },
          { label: "Raporlar", href: routes.admin.reports, icon: <BarChart3 className="h-4 w-4" /> },
        ],
      },
      {
        title: "Stok",
        icon: <Package className="h-4 w-4" />,
        items: [
          { label: "Satış Kataloğu", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
        ],
      },
      {
        title: "İşlemler",
        icon: <ClipboardList className="h-4 w-4" />,
        items: [
          { label: "Satışlar", href: routes.admin.sales, icon: <ShoppingCart className="h-4 w-4" /> },
          { label: "Yeni Satış", href: routes.admin.salesNew, icon: <ShoppingCart className="h-4 w-4" /> },
          { label: "Teklifler", href: routes.admin.proposals, icon: <FileText className="h-4 w-4" /> },
          { label: "Görev ve Talepler", href: routes.admin.tasks, icon: <ClipboardList className="h-4 w-4" /> },
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
        title: "Süreli Hizmetlerim",
        icon: <Briefcase className="h-4 w-4" />,
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
    <Link
      href={item.href}
      className={cn(
        "group flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "transition-colors group-hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  )
}

function SectionHeader({
  section,
  hasActiveItem,
  isOpen,
  onToggle,
}: {
  section: NavSection
  hasActiveItem: boolean
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md px-3 text-xs font-semibold uppercase tracking-wider transition-colors",
        hasActiveItem ? "text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {section.icon}
        <span className="truncate">{section.title}</span>
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )}
      />
    </button>
  )
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname() || "/"

  const isActive = React.useCallback((href: string) => pathname === href, [pathname])

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push(routes.login)
  }

  const sections = React.useMemo(() => getSections(pathname), [pathname])
  const activeSectionTitles = React.useMemo(
    () => sections.filter((section) => section.items.some((item) => isActive(item.href))).map((section) => section.title),
    [isActive, sections]
  )
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    () => new Set(sections.map((section) => section.title))
  )

  React.useEffect(() => {
    setOpenSections((current) => {
      const next = new Set(current)
      activeSectionTitles.forEach((title) => next.add(title))
      return next
    })
  }, [activeSectionTitles])

  const toggleSection = (title: string) => {
    setOpenSections((current) => {
      const next = new Set(current)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <nav className="flex h-full flex-col gap-1">
      <div className="flex-1">
        {sections.map((section) => {
          const hasActiveItem = section.items.some(item => isActive(item.href))
          const isOpen = openSections.has(section.title)

          return (
            <div key={section.title} className="border-b border-border/70 py-2 first:pt-0 last:border-b-0">
              <SectionHeader
                section={section}
                hasActiveItem={hasActiveItem}
                isOpen={isOpen}
                onToggle={() => toggleSection(section.title)}
              />
              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => (
                    <NavItemLink
                      key={item.label}
                      item={item}
                      isActive={isActive(item.href)}
                    />
                  ))}
                </div>
              )}
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
  )
}
