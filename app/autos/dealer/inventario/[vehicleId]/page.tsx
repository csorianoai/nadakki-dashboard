"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import {
  DMS02R_ECONOMICS_PATHS,
  DMS02R_HTTP_IN_PRODUCTION_OPENAPI,
} from "@/lib/dealer/dms02r-http";
import { fetchDealerVehicleStatus } from "@/lib/dealer/vehicle-status";

export default function DealerVehicleEconomicsPage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const query = useQuery({
    queryKey: ["dealer-vehicle-status", vehicleId],
    queryFn: () => fetchDealerVehicleStatus(vehicleId),
    enabled: vehicleId.length > 0,
    retry: false,
  });

  const title = query.data
    ? [query.data.year, query.data.make, query.data.model].filter(Boolean).join(" ") || query.data.id
    : vehicleId || "Vehículo";

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg break-words">{title}</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">Estado del vehículo y economía DMS-02R.</p>
      </header>

      {!vehicleId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">Falta el identificador del vehículo.</p>
      ) : query.isPending || query.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-vehicle-loading">
          Cargando vehículo…
        </p>
      ) : query.error instanceof AccessApiError ? (
        <section
          role="alert"
          data-testid="dealer-vehicle-error"
          data-reason-code={query.error.reason_code ?? ""}
          data-http-status={String(query.error.status)}
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo leer el vehículo</h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            reason_code: <code>{query.error.reason_code ?? `HTTP_${query.error.status}`}</code>
          </p>
        </section>
      ) : query.data ? (
        <section data-testid="dealer-vehicle-ready" className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
          <h2 className="font-manrope text-lg font-bold text-nk-fg">Estado</h2>
          <p className="mt-1 text-sm text-nk-fg-muted">{query.data.status ?? "no disponible"}</p>
        </section>
      ) : null}

      <section
        role="alert"
        data-testid="dealer-economics-blocked"
        data-blocked-by-backend="true"
        className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Costes, margen y días en inventario</h2>
        <p className="mt-2 text-sm text-nk-fg-muted">
          BLOCKED_BY_BACKEND. El writer DMS-02R está en backend main (#1361). La superficie HTTP (#1365)
          no está en el OpenAPI de producción (957 rutas). No se inventan costes ni márgenes.
        </p>
        {DMS02R_HTTP_IN_PRODUCTION_OPENAPI ? null : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-nk-fg">
            <li>
              <code>{DMS02R_ECONOMICS_PATHS.margin}</code>
            </li>
            <li>
              <code>{DMS02R_ECONOMICS_PATHS.days}</code>
            </li>
            <li>
              <code>{DMS02R_ECONOMICS_PATHS.costs}</code> (POST en #1365; no hay GET de costes)
            </li>
          </ul>
        )}
      </section>
    </main>
  );
}
