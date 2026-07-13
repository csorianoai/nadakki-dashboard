"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { AdminPanelLink } from "@/components/cockpit/AdminPanelLink";
import { fetchTenants } from "@/lib/cockpit/api/tenantAdmin";
import { adminTenantConfigUrl } from "@/lib/cockpit/consolidation";
import { normalizeStatus } from "@/lib/cockpit/normalize";
import type { TenantRecord } from "@/lib/cockpit/types-platform";

export function TenantDetailView({ tenantId }: { tenantId: string }) {
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchTenants();
    setIsDemo(r.isDemo);
    setTenant(r.tenants.find((t) => t.id === tenantId) ?? null);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-cockpit-muted">Cargando tenant…</p>;
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Link href="/cockpit/tenants" className="inline-flex items-center gap-2 text-sm text-cockpit-muted hover:text-cockpit-text">
          <ArrowLeft className="h-4 w-4" /> Tenants
        </Link>
        <p className="text-cockpit-muted">Tenant no encontrado.</p>
      </div>
    );
  }

  const st = normalizeStatus(tenant.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cockpit/tenants" className="inline-flex items-center gap-2 text-sm text-cockpit-muted hover:text-cockpit-text">
          <ArrowLeft className="h-4 w-4" /> Tenants
        </Link>
        <AdminPanelLink href={adminTenantConfigUrl(tenant.id)}>Configurar en Panel admin →</AdminPanelLink>
      </div>
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      <header>
        <h1 className="text-2xl font-semibold text-cockpit-text">{tenant.name}</h1>
        <p className="font-mono text-sm text-cockpit-muted">{tenant.slug}</p>
      </header>
      <dl className="grid gap-4 rounded-xl border border-cockpit-border bg-cockpit-surface p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-cockpit-muted">Estado</dt>
          <dd className="mt-1 capitalize tabular-nums">{st}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-cockpit-muted">Plan</dt>
          <dd className="mt-1">{tenant.plan_name ?? tenant.plan_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-cockpit-muted">Locale</dt>
          <dd className="mt-1 font-mono text-sm">{tenant.locale}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-cockpit-muted">Moneda</dt>
          <dd className="mt-1 font-mono text-sm">{tenant.currency}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase text-cockpit-muted">Cores</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {(tenant.core_codes ?? []).map((c) => (
              <span key={c} className="rounded bg-cockpit-accent/15 px-1.5 text-xs">
                {c}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
