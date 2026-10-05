"use client";

import { useQuery } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import {
  fetchVehicleDays,
  fetchVehicleMargins,
} from "@/lib/dealer/vehicle-economics";

export function DealerVehicleEconomicsPanel({ vehicleId }: { vehicleId: string }) {
  const tenantId = getAccessClientContext()?.tenantId ?? "";
  const enabled = vehicleId.length > 0 && tenantId.length > 0;
  const margins = useQuery({
    queryKey: ["dealer-vehicle-margin", tenantId, vehicleId],
    queryFn: () => fetchVehicleMargins(vehicleId, tenantId),
    enabled,
    retry: false,
  });
  const days = useQuery({
    queryKey: ["dealer-vehicle-days", tenantId, vehicleId],
    queryFn: () => fetchVehicleDays(vehicleId, tenantId),
    enabled,
    retry: false,
  });

  if (!tenantId) {
    return (
      <p role="alert" className="text-sm text-nk-fg-muted">
        Falta el tenant para leer margen y días.
      </p>
    );
  }

  if (margins.isPending || margins.isLoading || days.isPending || days.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-economics-loading">
        Cargando economía…
      </p>
    );
  }

  if (margins.error || days.error) {
    const access =
      margins.error instanceof AccessApiError
        ? margins.error
        : days.error instanceof AccessApiError
          ? days.error
          : null;
    return (
      <section
        role="alert"
        data-testid="dealer-economics-error"
        data-reason-code={access?.reason_code ?? "DEFAULT_DENY"}
        data-http-status={access ? String(access.status) : undefined}
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudieron leer el margen y los días en stock</h2>
        <p className="mt-1 text-xs text-nk-fg-muted break-words">
          Código para soporte: {access?.reason_code ?? `HTTP_${access?.status ?? "error"}`}
        </p>
      </section>
    );
  }

  const marginRows = margins.data ?? [];
  const daysRow = days.data;
  const empty =
    marginRows.length === 0 &&
    (!daysRow || (daysRow.acquired_at == null && daysRow.days_in_inventory == null));

  if (empty) {
    return (
      <p data-testid="dealer-economics-empty" className="text-sm text-nk-fg-muted">
        Todavía no hay margen ni días en stock para este vehículo: aparecen cuando se registra su compra o ingreso.
      </p>
    );
  }

  return (
    <section
      data-testid="dealer-economics-ready"
      className="max-w-full space-y-3 overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
    >
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Costes, margen y días en inventario</h2>
      {daysRow?.days_in_inventory != null ? (
        <p className="text-sm text-nk-fg">Días en inventario: {daysRow.days_in_inventory}</p>
      ) : null}
      {daysRow?.acquired_at ? (
        <p className="text-sm text-nk-fg-muted break-words">Adquirido: {daysRow.acquired_at}</p>
      ) : null}
      {marginRows.length > 0 ? (
        <ul className="space-y-2">
          {marginRows.map((row) => (
            <li key={row.currency} className="text-sm text-nk-fg break-words">
              {row.currency}: venta {row.sale_price_amount}, coste {row.total_cost}, margen {row.margin}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
