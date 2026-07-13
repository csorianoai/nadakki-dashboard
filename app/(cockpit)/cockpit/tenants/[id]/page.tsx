import { TenantDetailView } from "@/components/cockpit/tenants/TenantDetailView";

export default function CockpitTenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <TenantDetailView tenantId={params.id} />;
}
