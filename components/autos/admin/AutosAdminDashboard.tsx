"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { VehicleModeration } from "@/components/autos/admin/VehicleModeration";
import { DealerVerification } from "@/components/autos/admin/DealerVerification";
import { FeatureFlagsPanel } from "@/components/autos/admin/FeatureFlagsPanel";
import { CommissionTracker } from "@/components/autos/admin/CommissionTracker";
import { useAutosAdminAccess } from "@/components/autos/admin/AutosAdminGate";
import { TENANT_OPTIONS, TENANTS, type TenantSlug } from "@/lib/tenants";
import { cn } from "@/lib/utils";

type TabId = "vehicles" | "dealers" | "flags" | "commissions";

const TABS: { id: TabId; label: string; accessKey: keyof ReturnType<typeof useAutosAdminAccess> }[] = [
  { id: "vehicles", label: "Moderación vehículos", accessKey: "canModerateVehicles" },
  { id: "dealers", label: "Verificación dealers", accessKey: "canVerifyDealers" },
  { id: "flags", label: "Feature flags", accessKey: "canManageFlags" },
  { id: "commissions", label: "Comisiones", accessKey: "canViewCommissions" },
];

export function AutosAdminDashboard() {
  const access = useAutosAdminAccess();
  const [tenantSlug, setTenantSlug] = useState<TenantSlug>("nadakki");
  const visibleTabs = useMemo(
    () => TABS.filter((t) => access[t.accessKey]),
    [access],
  );
  const [activeTab, setActiveTab] = useState<TabId>(
    visibleTabs[0]?.id ?? "flags",
  );

  const pendingSummary = useMemo(() => {
    const items: string[] = [];
    if (access.canModerateVehicles) items.push("Vehículos pendientes de revisión");
    if (access.canVerifyDealers) items.push("Dealers KYC pendientes");
    if (access.canManageFlags) items.push("Feature flags por tenant");
    return items;
  }, [access]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Autos Portal</p>
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="mt-1 text-sm text-gray-600">
            Moderación, verificación, flags y comisiones (MVP)
          </p>
        </div>
        <Link href="/admin" className="text-sm text-blue-600 underline">
          ← Consola admin
        </Link>
      </div>

      {pendingSummary.length > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Acciones pendientes</p>
          <ul className="mt-1 list-inside list-disc">
            {pendingSummary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="admin-tenant">
          Tenant
        </label>
        <select
          id="admin-tenant"
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value as TenantSlug)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          disabled={!access.isPlatformAdmin}
        >
          {TENANT_OPTIONS.map((slug) => (
            <option key={slug} value={slug}>
              {TENANTS[slug].name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "vehicles" && access.canModerateVehicles ? (
        <VehicleModeration tenantSlug={tenantSlug} />
      ) : null}
      {activeTab === "dealers" && access.canVerifyDealers ? (
        <DealerVerification tenantSlug={tenantSlug} />
      ) : null}
      {activeTab === "flags" && access.canManageFlags ? (
        <FeatureFlagsPanel tenantSlug={tenantSlug} />
      ) : null}
      {activeTab === "commissions" && access.canViewCommissions ? (
        <CommissionTracker />
      ) : null}
    </div>
  );
}
