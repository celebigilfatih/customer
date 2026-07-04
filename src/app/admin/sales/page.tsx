import { redirect } from "next/navigation"

import { routes } from "@/lib/routes"

export default function AdminSalesPage() {
  redirect(routes.admin.salesNew)
}
