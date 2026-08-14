"use client";

import { StipulationStatusBadge } from "@/components/bank/stipulations/StatusBadge";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { useStipulations } from "@/hooks/useStipulations";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export function StipulationsTab({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const { stipulations, error, isLoading, mutate } = useStipulations(applicationId, apiTenantId);
  const rows = stipulations ?? [];
  
  // Si hay error Y además no hay datos, mostrar error
  // Si no hay error PERO tampoco hay datos (200 con lista vacía), mostrar EmptyState
  const hasError = Boolean(error);
  const hasData = Array.isArray(stipulations);

  return (
    <CHPanelState
      isLoading={isLoading}
      isError={hasError && !hasData}
      onRetry={() => void mutate()}
      errorTitle="Estipulaciones no disponibles"
      loadingLabel="Cargando estipulaciones…"
    >
      {rows.length === 0 ? (
        <EmptyStateRich
          variant="placeholder"
          title="Sin estipulaciones"
          description="Esta solicitud no tiene estipulaciones registradas."
        />
      ) : (
        <div className="space-y-3" data-testid="credit-hub-stipulations-list">
          {rows.map((s, i) => (
            <div key={s.id} className="ch-card" style={{ padding: 14 }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div style={{ fontSize: 11, color: "var(--ch-text-3)" }}>#{i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{s.description}</div>
                  {s.type ? (
                    <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 4 }}>{s.type}</div>
                  ) : null}
                </div>
                <StipulationStatusBadge status={s.status} />
              </div>
              {s.sla_deadline ? (
                <div style={{ fontSize: 11, color: "var(--ch-text-3)", marginTop: 8 }}>SLA · {s.sla_deadline}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </CHPanelState>
  );
}
