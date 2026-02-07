import { redirect } from "next/navigation"
import { routes } from "@/lib/routes"

export default function AdminRootRedirect() {
  redirect(routes.admin.dashboard)
}