import { Suspense } from "react";
import { notFound } from "next/navigation";
import CockpitFinanceTenantClient from "./TenantClient";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export default function CockpitFinanceTenantPage({ params }: { params: { slug: string } }) {
  if (!COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_TENANT_DETAIL_ENABLED) {
    notFound();
  }
  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando tenant…</p>}>
      <CockpitFinanceTenantClient slug={params.slug} />
    </Suspense>
  );
}
