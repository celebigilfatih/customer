import { redirect } from "next/navigation"

export default async function EditCustomerRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/customers/${id}/edit`)
}
