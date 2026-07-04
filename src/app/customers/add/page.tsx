import { redirect } from "next/navigation"

export default function AddCustomerRedirectPage() {
  redirect("/admin/customers/add")
}
