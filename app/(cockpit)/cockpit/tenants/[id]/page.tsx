import { TenantDetailView } from "@/components/cockpit/tenants/TenantDetailView";

export default async function CockpitTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenantDetailView tenantId={id} />;
}