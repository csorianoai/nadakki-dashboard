import { Suspense } from "react";
import { notFound } from "next/navigation";
import CockpitFinanceTenantClient from "./TenantClient";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export default async function CockpitFinanceTenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_TENANT_DETAIL_ENABLED) {
    notFound();
  }

  return (
    <Suspense fallback={<p className="text-sm text-cockpit-muted">Cargando tenant…</p>}>
      <CockpitFinanceTenantClient slug={slug} />
    </Suspense>
  );
}
