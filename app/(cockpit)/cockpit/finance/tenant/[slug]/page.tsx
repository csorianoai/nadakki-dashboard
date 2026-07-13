import { Suspense } from "react";
import CockpitFinanceTenantClient from "./TenantClient";

export default async function CockpitFinanceTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando tenant…</p>}>
      <CockpitFinanceTenantClient slug={slug} />
    </Suspense>
  );
}
