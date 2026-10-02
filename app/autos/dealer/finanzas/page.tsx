"use client";

/**
 * Finanzas por vehiculo. El menu del dealer ya enlazaba aqui
 * (dealer-nav.ts:63) y la ruta daba 404.
 *
 * Se elige el vehiculo del inventario privado del dealer: el backend de costos
 * trabaja por `vehicle_id`, asi que sin unidad elegida no hay nada que leer.
 * El frontend no concede: sin contexto de dealer, con el batch cargando, en
 * error, o sin alguna de las dos claves, no se pinta el panel.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  isAccessUnverified,
  unverifiedReasonFromBatch,
} from "@/lib/access/reason-codes";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import {
  COSTS_CAPABILITY,
  COSTS_CAPABILITY_KEYS,
  COSTS_VEHICLE_CAPABILITY,
} from "@/lib/dealer-management/vehicle-costs";
import { CostosVehiculoPanel } from "./CostosVehiculoPanel";

const CARD_CLASS = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";

export default function DealerFinanzasPage() {
  const resolved = resolveDealerAccessContext();
  const context = resolved.status === "ready" ? resolved.context : null;
  const access = useAccessEntitlementsBatch(COSTS_CAPABILITY_KEYS);
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);
  const [vehicleId, setVehicleId] = useState("");

  const cerrado = access.isLoading || access.isPending || Boolean(access.error);
  const granted = (key: string) => !cerrado && access.data?.results[key]?.allowed === true;
  const verVehiculos = granted(COSTS_VEHICLE_CAPABILITY);
  const verCostos = granted(COSTS_CAPABILITY);

  /**
   * El motivo que da el motor, SIN inventar ninguno. Antes caia a "DEFAULT_DENY"
   * cuando el batch no mandaba codigo: eso es un codigo que el backend nunca
   * emitio, pintado como si lo hubiera emitido. Un motivo inventado es peor que
   * ninguno, porque se puede buscar en los logs y no esta.
   */
  const denyReason = access.error instanceof AccessApiError
    ? (access.error.reason_code ?? `HTTP_${access.error.status}`)
    : (access.data?.results[COSTS_CAPABILITY]?.reason_code ?? null);

  /**
   * "No pude evaluarte" no es "no tienes derecho" (#550). Cuando el motor deniega
   * por `no_organization_unit` o `no_beneficiary_entitlement` no esta diciendo que
   * falte la capability: esta diciendo que no llego a comprobarlo. Nombrar la
   * capability ahi manda al usuario a pedir un permiso que quiza ya tiene.
   */
  /**
   * Se recorre el batch ENTERO, no solo la clave de costos. Esta pantalla pide dos
   * capabilities --costos y ver vehiculos-- y la denegacion es POR capability: el
   * motor puede no haber podido evaluar la de vehiculos y si la de costos. Mirando
   * solo una, ese caso se leia como "no tienes la capability".
   *
   * `isAccessUnverified(denyReason)` se mantiene para el camino del error HTTP,
   * donde no hay batch que recorrer y el codigo viene del AccessApiError.
   */
  const motivoNoVerificado =
    unverifiedReasonFromBatch(access.data?.results) ??
    (isAccessUnverified(denyReason) ? denyReason : null);
  const noVerificado = Boolean(motivoNoVerificado);

  const inventory = useQuery({
    queryKey: ["dealer-private-inventory", context?.dealerId ?? "none"],
    queryFn: () => fetchDealerInventory(context!.dealerId),
    enabled: Boolean(context && verVehiculos && verCostos),
    retry: false,
  });

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Finanzas por vehículo</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Costos de cada unidad y su total acumulado, en la moneda funcional del tenant.
        </p>
      </header>

      {!context ? (
        <div role="alert" data-testid="finanzas-sin-contexto" className={CARD_CLASS}>
          Finanzas bloqueadas: {resolved.reason_code}
        </div>
      ) : access.isLoading || access.isPending ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : !verCostos || !verVehiculos ? (
        <div
          role="alert"
          data-testid="finanzas-bloqueado"
          data-allowed="false"
          data-no-verificado={noVerificado ? "true" : "false"}
          {...(denyReason ? { "data-reason-code": denyReason } : {})}
          className={CARD_CLASS}
        >
          {noVerificado ? (
            <>
              <strong>{ACCESS_UNVERIFIED_MESSAGE}.</strong> {ACCESS_UNVERIFIED_DETAIL}
            </>
          ) : (
            <>
              Los costos y el margen de cada unidad están reservados a quien tenga la capability{" "}
              <code>{COSTS_CAPABILITY}</code>.
            </>
          )}
          {noVerificado || denyReason ? (
            <>
              {" "}
              reason_code: <code>{motivoNoVerificado ?? denyReason}</code>
            </>
          ) : null}
        </div>
      ) : (
        <>
          <section className={CARD_CLASS}>
            <label className="block">
              <span className="block text-sm font-semibold text-nk-fg">Vehículo</span>
              {inventory.isPending || inventory.isLoading ? (
                <p className="mt-1 animate-pulse text-sm text-nk-fg-muted">Cargando el inventario…</p>
              ) : inventory.error ? (
                <p role="alert" data-testid="finanzas-inventario-error" className="mt-1 text-sm text-nk-fg">
                  No se pudo cargar el inventario privado del dealer.
                </p>
              ) : (
                <select
                  name="vehicleId"
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  data-testid="finanzas-vehiculo"
                  className="mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg"
                >
                  <option value="">Elegí una unidad…</option>
                  {(inventory.data ?? []).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.id}
                    </option>
                  ))}
                </select>
              )}
            </label>
            {!inventory.isPending && !inventory.error && (inventory.data?.length ?? 0) === 0 ? (
              <p className="mt-2 text-sm text-nk-fg-muted">
                El contrato privado no reporta vehículos para este dealer.
              </p>
            ) : null}
          </section>

          {vehicleId ? (
            <CostosVehiculoPanel vehicleId={vehicleId} tenantId={context.tenantId} locale={locale} />
          ) : (
            <p data-testid="finanzas-sin-vehiculo" className="text-sm text-nk-fg-muted">
              Elegí una unidad para ver sus costos.
            </p>
          )}
        </>
      )}
    </main>
  );
}
