"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Ana Sayfa", href: "/", icon: Trophy },
  { name: "Başvuru Yap", href: "/basvuru", icon: FileText },
  { name: "Katılımcı Takımlar", href: "/takimlar", icon: Users },
  { name: "Yönetici Paneli", href: "/admin", icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Turnuva Yönetim Sistemi
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile menu button - can be expanded later */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              Menu
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}