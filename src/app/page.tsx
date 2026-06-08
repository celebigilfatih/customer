"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { routes } from "@/lib/routes"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push(routes.login)
  }, [router])

  return null
}
