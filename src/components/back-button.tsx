"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import React from "react"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]
type ButtonSize = React.ComponentProps<typeof Button>["size"]

interface BackButtonProps {
  fallbackHref: string
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function BackButton({ fallbackHref, label = "Geri Dön", variant, size, className }: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = () => {
    try {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back()
      } else {
        router.push(fallbackHref)
      }
    } catch {
      router.push(fallbackHref)
    }
  }

  const computedVariant: ButtonVariant = variant ?? (pathname && pathname.startsWith("/admin") ? "outline" : "ghost")
  const computedSize: ButtonSize = size ?? "sm"

  return (
    <Button variant={computedVariant} size={computedSize} onClick={handleClick} className={className}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
