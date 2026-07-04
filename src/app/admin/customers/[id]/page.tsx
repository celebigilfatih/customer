import { CustomerAdminDetailTabs } from "@/components/customer-admin-detail-tabs"

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const requestedTab = query.tab || "general"

  return <CustomerAdminDetailTabs customerId={id} initialTab={requestedTab} />
}
