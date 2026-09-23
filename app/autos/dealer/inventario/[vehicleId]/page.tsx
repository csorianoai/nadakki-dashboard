"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DealerVehicleEconomicsPanel } from "@/components/dealer/DealerVehicleEconomicsPanel";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import { fetchDealerVehicleStatus } from "@/lib/dealer/vehicle-status";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
import { DEALER_VEHICLE_CAPABILITY } from "@/lib/dealer/capabilities";
import type { EntitlementDecision } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

function asDecision(query: ReturnType<typeof useAccessEntitlementsBatch>): EntitlementDecision {
  if (query.error instanceof AccessApiError) {
    return {
      allowed: false,
      reason_code: (query.error.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
    };
  }
  const item = query.data?.results?.[DEALER_VEHICLE_CAPABILITY];
  if (!item) return { allowed: false, reason_code: "DEFAULT_DENY" };
  return {
    allowed: item.allowed === true,
    reason_code: (item.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
  };
}

function VehicleFicha({ dealerId, vehicleId }: { dealerId: string; vehicleId: string }) {
  const query = useQuery({
    queryKey: ["dealer-vehicle", dealerId, vehicleId],
    queryFn: () => fetchDealerVehicleStatus(dealerId, vehicleId),
    enabled: dealerId.length > 0 && vehicleId.length > 0,
    retry: false,
  });

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-vehicle-loading">
        Cargando ficha…
      </p>
    );
  }

  if (query.error instanceof AccessApiError) {
    return (
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
    );
  }

  if (!query.data) return null;

  const title = [query.data.year, query.data.make, query.data.model].filter(Boolean).join(" ") || query.data.id;

  return (
    <>
      <section data-testid="dealer-vehicle-ready" className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
        <h2 className="font-manrope text-lg font-bold text-nk-fg break-words">{title}</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">Estado: {query.data.status ?? "no disponible"}</p>
      </section>
      <DealerVehicleEconomicsPanel vehicleId={vehicleId} />
    </>
  );
}

export default function DealerVehicleEconomicsPage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const resolved = resolveDealerAccessContext();
  const dealerId = resolved.status === "ready" ? resolved.context.dealerId : "";
  const access = useAccessEntitlementsBatch([DEALER_VEHICLE_CAPABILITY]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const decision = asDecision(access);

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg break-words">
          {vehicleId || "Vehículo"}
        </h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Ficha autenticada del dealer. Margen y días salen del GET autenticado. El marketplace público no es fuente.
        </p>
      </header>

      {!vehicleId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">
          Falta el identificador del vehículo.
        </p>
      ) : access.isPending || access.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-vehicle-loading">
          Cargando acceso…
        </p>
      ) : access.error instanceof AccessApiError ? (
        <section
          role="alert"
          data-testid="dealer-vehicle-error"
          data-reason-code={access.error.reason_code ?? ""}
          data-http-status={String(access.error.status)}
          data-allowed="false"
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo verificar el acceso</h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            reason_code: <code>{access.error.reason_code ?? `HTTP_${access.error.status}`}</code>
          </p>
        </section>
      ) : !decision.allowed ? (
        <section
          role="alert"
          data-testid="dealer-vehicle-gated"
          data-reason-code={decision.reason_code}
          data-allowed="false"
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">
            {REASON_CODE_INFO[decision.reason_code]?.title ?? decision.reason_code}
          </h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            {REASON_CODE_INFO[decision.reason_code]?.description ?? "Esta superficie no está disponible."}
          </p>
          <p className="mt-2 text-xs font-semibold text-nk-fg">
            reason_code: <code>{decision.reason_code}</code>
          </p>
          {REASON_CODE_INFO[decision.reason_code]?.action_required === "upgrade_plan" ||
          decision.reason_code === "UPGRADE_REQUIRED" ? (
            <button
              type="button"
              className="mt-3 min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
              onClick={() => setUpgradeOpen(true)}
            >
              Ver planes publicados
            </button>
          ) : null}
          {upgradeOpen ? <UpgradeModal decision={decision} onClose={() => setUpgradeOpen(false)} /> : null}
        </section>
      ) : !dealerId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">
          Falta el dealer para leer la ficha autenticada.
        </p>
      ) : (
        <VehicleFicha dealerId={dealerId} vehicleId={vehicleId} />
      )}
    </main>
  );
}
