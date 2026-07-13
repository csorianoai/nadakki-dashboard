import { Suspense } from "react";
import CockpitFinanceTenantClient from "./TenantClient";

export default function CockpitFinanceTenantPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando tenant…</p>}>
      <CockpitFinanceTenantClient slug={params.slug} />
    </Suspense>
  );
}
