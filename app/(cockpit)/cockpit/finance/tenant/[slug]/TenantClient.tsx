"use client";

import { Suspense } from "react";
import { TenantDetailView } from "@/components/cockpit/finance/tenant/TenantDetailView";

export default function CockpitFinanceTenantClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando tenant…</p>}>
      <TenantDetailView tenantRef={slug} />
    </Suspense>
  );
}
