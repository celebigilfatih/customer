import { redirect } from "next/navigation"
import { routes } from "@/lib/routes"

export default function PortalRootRedirect() {
  redirect(routes.portal.dashboard)
}
