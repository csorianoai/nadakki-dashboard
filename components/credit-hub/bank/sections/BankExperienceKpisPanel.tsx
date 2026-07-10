"use client";

import { useQuery } from "@tanstack/react-query";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getBankExperienceKpis,
  isBankExperienceEndpointUnavailable,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function BankExperienceKpisPanel({ period }: { period: "today" | "week" | "month" }) {
  const { apiTenantId } = useTenant();

  const q = useQuery({
    queryKey: ["bank-experience-kpis", apiTenantId, period],
    queryFn: () => getBankExperienceKpis({ tenantId: apiTenantId!, period }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const kpis = q.data?.kpis ?? [];
  const hasActivity = kpis.some((k) => {
    const v = k.value;
    if (v == null || v === "") return false;
    if (typeof v === "number") return v > 0;
    return true;
  });

  if (q.isLoading) {
    return (
      <div className="ch-card p-4 text-sm text-forgeGray-500" data-testid="bank-kpis-loading">
        Cargando KPIs operativos…
      </div>
    );
  }

  if (!hasActivity) {
    return (
      <div className="ch-card p-4" data-testid="bank-kpis-empty">
        <h3 className="ch-serif" style={{ margin: "0 0 6px", fontSize: 15 }}>
          KPIs operativos
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ch-text-3)" }}>Sin actividad en este periodo</p>
      </div>
    );
  }

  return (
    <div className="ch-card p-4" data-testid="bank-experience-kpis">
      <h3 className="ch-serif" style={{ margin: "0 0 12px", fontSize: 15 }}>
        KPIs operativos
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="rounded-lg border border-forgeGray-100 p-3" data-testid={`bank-kpi-${k.key}`}>
            <div className="ch-eyebrow">{k.label}</div>
            <div className="ch-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
              {k.value ?? "—"}
              {k.unit ? <span style={{ fontSize: 12, marginLeft: 4 }}>{k.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
