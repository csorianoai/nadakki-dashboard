"use client";

/**
 * Ficha interna con compra y roles (F4C-6, 3.2 de backend#2548).
 *
 * Costos, margen y numero de motor solo se pintan con `autos.costs.view`: sin la
 * capacidad el componente ni se monta (no hay nodo vacio ni peticion). Lo que el
 * backend aun no publica (lineas de pago, tipo de cambio, checklist, vendedor,
 * edicion con historial) no se inventa: queda deshabilitado con su motivo.
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { formateaFecha } from "@/lib/dealer-management/formato";
import { fetchVehicleDays, fetchVehicleMargins } from "@/lib/dealer/vehicle-economics";
import { DetalleTecnico } from "../DetalleTecnico";

/** No esta en el catalogo 097 (`capabilities.ts` la rechazaria): se pide tal cual y el default es negar. */
export const COSTS_VIEW_CAPABILITY = "autos.costs.view";

/**
 * F-23: una fecha de adquisicion es un dia, no un instante. El backend la manda
 * como "2026-11-01T00:00:00Z"; leerla como instante en GMT-3 la corre a 31/10.
 * Se toma el AAAA-MM-DD del texto y se formatea sin zona.
 */
export function fechaSinZona(valor: string | null | undefined, locale?: string): string | null {
  const dia = /^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/.exec(valor?.trim() ?? "")?.[1];
  return dia ? formateaFecha(dia, locale ? { locale } : undefined) : null;
}

function useTenant() {
  return getAccessClientContext()?.tenantId ?? "";
}

function NoDisponible({ testId, children }: { testId: string; children: string }) {
  return (
    <p data-testid={testId} className="text-sm text-nk-fg-muted">
      {children}
    </p>
  );
}

const caja = "max-w-full space-y-2 overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4";

export function FichaCompra({ vehicleId }: { vehicleId: string }) {
  const tenantId = useTenant();
  const days = useQuery({
    queryKey: ["dealer-vehicle-days", tenantId, vehicleId],
    queryFn: () => fetchVehicleDays(vehicleId, tenantId),
    enabled: vehicleId.length > 0 && tenantId.length > 0,
    retry: false,
  });
  const fecha = fechaSinZona(days.data?.acquired_at);
  return (
    <section data-testid="ficha-compra" className={caja}>
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Compra</h2>
      <p className="text-sm text-nk-fg" data-testid="ficha-fecha-adquisicion">
        Fecha de adquisición: {days.isPending ? "Cargando…" : (fecha ?? "Sin registrar")}
      </p>
      <NoDisponible testId="ficha-compra-motivo">
        Los datos registrados de compra se muestran más abajo cuando tu usuario puede consultarlos.
      </NoDisponible>
      <Link
        href={`/autos/dealer/inventario/${encodeURIComponent(vehicleId)}/registrar`}
        data-testid="dealer-vehicle-adquisicion"
        className="inline-flex min-h-11 items-center rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
      >
        Adquisición
      </Link>
    </section>
  );
}

/** Solo se monta con `autos.costs.view`. */
export function FichaCostos({ vehicleId, marginView = false }: { vehicleId: string; marginView?: boolean }) {
  const tenantId = useTenant();
  const enabled = vehicleId.length > 0 && tenantId.length > 0;
  const margins = useQuery({
    queryKey: ["dealer-vehicle-margin", tenantId, vehicleId],
    queryFn: () => fetchVehicleMargins(vehicleId, tenantId),
    enabled: enabled && marginView,
    retry: false,
  });
  const days = useQuery({
    queryKey: ["dealer-vehicle-days", tenantId, vehicleId],
    queryFn: () => fetchVehicleDays(vehicleId, tenantId),
    enabled,
    retry: false,
  });
  const error = (marginView ? margins.error : null) ?? days.error;
  const rows = marginView ? margins.data ?? [] : [];
  const enStock = days.data?.days_in_inventory ?? null;

  let cuerpo;
  if (!tenantId) {
    cuerpo = <p role="alert" className="text-sm text-nk-fg-muted">Falta el tenant para leer margen y días.</p>;
  } else if ((marginView && margins.isPending) || days.isPending) {
    cuerpo = <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-economics-loading">Cargando economía…</p>;
  } else if (error) {
    const acceso = [margins.error, days.error].find((e) => e instanceof AccessApiError) as AccessApiError | undefined;
    cuerpo = (
      <div role="alert" data-testid="dealer-economics-error" data-reason-code={acceso?.reason_code ?? "DEFAULT_DENY"}>
        <p className="text-sm text-nk-fg">No se pudieron leer el margen y los días en stock. Prueba de nuevo en unos minutos.</p>
        <DetalleTecnico>
          <code>Código para soporte: {acceso?.reason_code ?? `HTTP_${acceso?.status ?? "error"}`}</code>
        </DetalleTecnico>
      </div>
    );
  } else if (rows.length === 0 && enStock == null) {
    cuerpo = (
      <p data-testid="dealer-economics-empty" className="text-sm text-nk-fg-muted">
        Todavía no hay margen ni días en stock para este vehículo: aparecen cuando se registra su compra o ingreso.
      </p>
    );
  } else {
    cuerpo = (
      <div data-testid="dealer-economics-ready" className="space-y-2">
        {enStock != null ? <p className="text-sm text-nk-fg">Días en inventario: {enStock}</p> : null}
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.currency} className="text-sm text-nk-fg break-words">
              {row.currency}: venta {row.sale_price_amount}, coste {row.total_cost}, margen {row.margin}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <section data-testid="ficha-costos" className={caja}>
      <h2 className="font-manrope text-lg font-bold text-nk-fg">{marginView ? "Costes, margen y días en inventario" : "Días en inventario"}</h2>
      {cuerpo}
    </section>
  );
}

export function FichaVendedor() {
  return (
    <section data-testid="ficha-vendedor" className={caja}>
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Vendedor</h2>
      <NoDisponible testId="ficha-vendedor-motivo">
        Disponible cuando se publique el contacto del vendedor (el DNI se mostrará enmascarado salvo rol autorizado).
      </NoDisponible>
    </section>
  );
}

export function FichaEdicionTecnica() {
  return (
    <section className={caja}>
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Datos técnicos</h2>
      <button
        type="button"
        disabled
        data-testid="ficha-editar-tecnicos"
        className="min-h-11 rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg-muted"
      >
        Editar marca, modelo, año, VIN y datos técnicos
      </button>
      <NoDisponible testId="ficha-editar-tecnicos-motivo">
        Disponible cuando se pueda editar con historial de cambios del usuario.
      </NoDisponible>
    </section>
  );
}
