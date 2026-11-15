"use client";

/**
 * Ficha interna con compra y roles (F4C-6, 3.2 de backend#2548).
 *
 * Costos, margen, compra y numero de motor solo se pintan con `autos.costs.view`: sin la
 * capacidad el componente ni se monta (no hay nodo vacio ni peticion). Lo que el
 * backend aun no publica (lineas de pago, tipo de cambio, checklist, vendedor,
 * edicion con historial) no se inventa: queda deshabilitado con su motivo.
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { decodeJWT } from "@/lib/auth/jwt-decode";
import { tokenStorage } from "@/lib/auth/token-storage";
import { formateaFecha } from "@/lib/dealer-management/formato";
import { fetchVehicleDays, fetchVehicleMargins } from "@/lib/dealer/vehicle-economics";
import { fetchCompra } from "./vehicle-purchase-read";
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

/**
 * Identidad de la sesion para las claves de cache de datos filtrados por rol (compra):
 * tenant + usuario. Sin identidad legible se usa un marcador que no coincide con ningun usuario real.
 */
function useIdentidadCache(): readonly [string, string] {
  const tenantId = useTenant();
  const p = decodeJWT(tokenStorage.getAccessToken() ?? "") as { sub?: string; user_id?: string } | null;
  return [tenantId, p?.sub ?? p?.user_id ?? "sin-identidad"] as const;
}

/** Una respuesta filtrada por rol no se reutiliza: sin staleTime y sin retencion al desmontar. */
const SIN_REUTILIZAR = { staleTime: 0, gcTime: 0 } as const;

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
export function FichaCostos({ vehicleId }: { vehicleId: string }) {
  const tenantId = useTenant();
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
  const error = margins.error ?? days.error;
  const rows = margins.data ?? [];
  const enStock = days.data?.days_in_inventory ?? null;

  let cuerpo;
  if (!tenantId) {
    cuerpo = <p role="alert" className="text-sm text-nk-fg-muted">Falta el tenant para leer margen y días.</p>;
  } else if (margins.isPending || days.isPending) {
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
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Costes, margen y días en inventario</h2>
      {cuerpo}
    </section>
  );
}

/** "18500000.00" -> "18.500.000" (decimales solo si no son cero). Sin coma flotante: es dinero. */
export function formateaImporte(valor: string): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(valor.trim());
  if (!m) return valor;
  const dec = (m[3] ?? "").replace(/0+$/, "");
  return `${m[1]}${m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${dec ? `,${dec}` : ""}`;
}

/** Centavos enteros de un importe decimal; null si no es decimal. */
function centavosDe(valor: string): bigint | null {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(valor.trim());
  return m ? BigInt(m[1]) * BigInt(100) + BigInt(((m[2] ?? "") + "00").slice(0, 2)) : null;
}

function deCentavos(c: bigint): string {
  const s = c.toString().padStart(3, "0");
  return `${s.slice(0, -2)}.${s.slice(-2)}`;
}

const METODOS: Record<string, string> = { efectivo: "Efectivo", transferencia: "Transferencia", cheque: "Cheque", otro: "Otro" };
const FUENTES_FX: Record<string, string> = { oficial_bna: "Oficial BNA", mep: "MEP", blue: "Blue", acordado: "Acordado", otra: "Otra" };

/**
 * Compra real (F4D-4). Solo se monta con `autos.costs.view`; con 403 del backend
 * no se pinta nada (ni vacia ni con aviso). Sin compra (vehiculo anterior a F4C): estado propio.
 */
export function FichaCompraDetalle({ vehicleId }: { vehicleId: string }) {
  const [tenantId, userId] = useIdentidadCache();
  const q = useQuery({
    queryKey: ["dealer-vehicle-purchase", tenantId, userId, vehicleId],
    queryFn: () => fetchCompra(vehicleId),
    ...SIN_REUTILIZAR,
    enabled: vehicleId.length > 0,
    retry: false,
  });
  if (q.error instanceof AccessApiError && q.error.status === 403) return null;
  if (q.isPending) {
    return (
      <section data-testid="ficha-compra-detalle" className={caja}>
        <p data-testid="compra-cargando" className="animate-pulse text-sm text-nk-fg-muted">Cargando compra…</p>
      </section>
    );
  }
  if (q.error) {
    const e = q.error instanceof AccessApiError ? q.error : null;
    return (
      <section data-testid="ficha-compra-detalle" className={caja}>
        <div role="alert" data-testid="compra-error" className="space-y-2">
          <p className="text-sm text-nk-fg">No se pudo leer la compra de este vehículo.</p>
          <button type="button" onClick={() => void q.refetch()} className="min-h-11 rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg">
            Reintentar
          </button>
          <DetalleTecnico>
            <code>{e?.reason_code ?? `HTTP_${e?.status ?? "error"}`}</code>
          </DetalleTecnico>
        </div>
      </section>
    );
  }
  const c = q.data;
  if (!c) {
    return (
      <section data-testid="ficha-compra-detalle" className={caja}>
        <p data-testid="compra-sin-registro" className="text-sm text-nk-fg-muted">
          Sin compra registrada. Regístrala desde Adquisición.
        </p>
      </section>
    );
  }
  const costo = centavosDe(c.cost);
  const vigentes = c.payments.filter((p) => !p.voided);
  // Total pagado: el del backend; si no llega, suma de las lineas vigentes (nunca las anuladas).
  const pagado =
    (c.paid_total ? centavosDe(c.paid_total) : null) ??
    vigentes.reduce<bigint | null>((acc, p) => {
      const x = centavosDe(p.amount);
      return acc === null || x === null ? null : acc + x;
    }, BigInt(0));
  const mon = c.currency ? ` ${c.currency}` : "";
  const fecha = fechaSinZona(c.acquired_on);
  const fxAl = fechaSinZona(c.fx?.as_of);
  return (
    <section data-testid="ficha-compra-detalle" className={caja}>
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Detalle de la compra</h2>
      <p data-testid="compra-costo" className="text-sm text-nk-fg">
        Costo: {formateaImporte(c.cost)}{mon}
      </p>
      <p className="text-sm text-nk-fg">
        Modo de adquisición: {c.mode ?? "Sin registrar"}
        {c.country_code ? ` · País ${c.country_code}` : ""}
        {fecha ? ` · ${fecha}` : ""}
        {c.supplier_reference ? ` · Ref. ${c.supplier_reference}` : ""}
      </p>
      <p data-testid="compra-pagos-estado" className="text-sm text-nk-fg">
        Pagos: {vigentes.length} línea{vigentes.length === 1 ? "" : "s"}
        {pagado !== null && costo !== null
          ? ` · ${pagado === costo ? "pagado" : "cubierto"} ${formateaImporte(deCentavos(pagado))} de ${formateaImporte(c.cost)}${mon}`
          : ""}
      </p>
      <ul className="space-y-1">
        {c.payments.map((p, i) => (
          <li key={i} data-testid="compra-pago" className={`text-sm break-words ${p.voided ? "text-nk-fg-muted line-through" : "text-nk-fg"}`}>
            {METODOS[p.method] ?? p.method}: {formateaImporte(p.amount)}{mon}
            {p.method === "cheque"
              ? ` · N.º ${p.check_number ?? "—"} · ${p.check_bank ?? "—"} · cobro ${fechaSinZona(p.check_cash_date) ?? "—"}`
              : ""}
            {p.detail ? ` · ${p.detail}` : ""}
            {p.voided ? " · anulado" : ""}
          </li>
        ))}
      </ul>
      {c.fx ? (
        <p data-testid="compra-fx" className="text-sm text-nk-fg break-words">
          Tipo de cambio: {c.fx.rate.includes(".") ? c.fx.rate.replace(/0+$/, "").replace(/\.$/, "").replace(".", ",") : c.fx.rate}
          {c.fx.source ? ` · Fuente ${FUENTES_FX[c.fx.source] ?? c.fx.source}` : ""}
          {c.fx.detail ? ` · ${c.fx.detail}` : ""}
          {fxAl ? ` · al ${fxAl}` : ""}
        </p>
      ) : null}
      {c.engine_number ? (
        <p data-testid="compra-motor" className="text-sm text-nk-fg break-words">Número de motor: {c.engine_number}</p>
      ) : null}
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
