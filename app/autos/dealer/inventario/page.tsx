"use client";

/**
 * Inventario privado del dealer.
 *
 * El acceso lo decide EL BATCH y nada mas. La version anterior bloqueaba antes de
 * mirarlo, con el contexto local:
 *
 *   :12-13  resolveDealerAccessContext() -> context, null si no estaba "ready"
 *   :24-25  !context -> "Inventario bloqueado: {resolved.reason_code}"
 *
 * Y ese contexto nunca llega a "ready" en produccion: `setDealerAccessContext`
 * (lib/dealer/access-context.ts:122) no tiene ningun llamador fuera de tests, y
 * el login (contexts/AuthContext.tsx:100-112) solo guarda tenant, nombre, rol y
 * plan. Sin dealer en localStorage, `resolveDealerAccessContext` devuelve
 * `no_dealer` con "DEFAULT_DENY" (:200-207). Medido en produccion: el batch
 * CONCEDE `autos.inventory.list` y a /api/v1/autos/* no llegaba ninguna
 * peticion, porque la pantalla se cerraba sola antes de pedir nada.
 *
 * El `dealerId` sigue haciendo falta --el contrato privado es por dealer-- pero
 * para CONSTRUIR la peticion, no para decidir el acceso. Se lee con
 * `selectedDealerIdentity`, que devuelve los ids aunque falte la unidad
 * organizativa (:255-262): la unidad la resuelve el backend.
 *
 * Ningun codigo inventado. Donde habia `?? "DEFAULT_DENY"` (:29) ahora se muestra
 * lo que el backend dijo, y si no dijo nada se dice eso.
 */

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  isAccessUnverified,
} from "@/lib/access/reason-codes";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";
import { VEHICLE_STATUS_LABEL, VEHICLE_WRITE_CAPABILITY } from "@/lib/dealer-management/vehicle-manual";
import {
  FILTROS_VACIOS,
  ORDENES,
  estadosPresentes,
  filtrarInventario,
  type FiltrosInventario,
  type OrdenInventario,
} from "@/lib/dealer-management/inventario-filtros";
import { DetalleTecnico } from "./DetalleTecnico";

const CAPABILITY = "autos.inventory.list";

const CAJA = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";

const CONTROL =
  "mt-1 min-h-10 w-full rounded-lg border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";

/** Buscar, filtrar por estado y ordenar (auditoria Mapaal QA, P1). */
function BarraInventario({
  filtros,
  estados,
  onChange,
}: {
  filtros: FiltrosInventario;
  estados: string[];
  onChange: (f: FiltrosInventario) => void;
}) {
  return (
    <div data-testid="inventario-barra" role="search" className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
      <label className="block text-sm font-semibold text-nk-fg">
        Buscar
        <input
          type="search"
          value={filtros.texto}
          onChange={(e) => onChange({ ...filtros, texto: e.target.value })}
          placeholder="Marca, modelo, año, dominio, n.º de stock o VIN"
          className={CONTROL}
        />
      </label>
      <label className="block text-sm font-semibold text-nk-fg">
        Estado
        <select value={filtros.estado} onChange={(e) => onChange({ ...filtros, estado: e.target.value })} className={CONTROL}>
          <option value="">Todos</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {VEHICLE_STATUS_LABEL[estado] ?? estado}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-nk-fg">
        Ordenar por
        <select
          value={filtros.orden}
          onChange={(e) => onChange({ ...filtros, orden: e.target.value as OrdenInventario })}
          className={CONTROL}
        >
          {ORDENES.map((orden) => (
            <option key={orden.value} value={orden.value}>
              {orden.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** "No se pudo verificar": es informacion sobre el motor, no una denegacion. */
function SinVerificar({ codigo }: { codigo: string }) {
  return (
    <section role="alert" data-testid="inventario-no-verificado" data-reason-code={codigo} className={CAJA}>
      <p className="font-semibold">{ACCESS_UNVERIFIED_MESSAGE}</p>
      <p className="mt-1 text-nk-fg-muted">{ACCESS_UNVERIFIED_DETAIL}</p>
    </section>
  );
}

export default function DealerInventoryPage() {
  const [filtros, setFiltros] = useState<FiltrosInventario>(FILTROS_VACIOS);
  /* Dos claves en UNA sola consulta: la de leer y la de crear. El CTA de alta
     se pinta solo con la de crear concedida; el frontend restringe y la
     autoridad sigue siendo el HTTP del backend. */
  const access = useAccessEntitlementsBatch([CAPABILITY, VEHICLE_WRITE_CAPABILITY]);
  const decision = access.data?.results[CAPABILITY];
  const cargando = access.isPending || access.isLoading;
  const allowed = !cargando && !access.error && decision?.allowed === true;
  const puedeCrear =
    !cargando && !access.error && access.data?.results[VEHICLE_WRITE_CAPABILITY]?.allowed === true;

  /** Solo para construir la peticion. No participa en la decision de acceso. */
  const binding = selectedDealerIdentity()?.dealerId ?? null;

  /**
   * Varias asignaciones: el usuario elige, y la eleccion vive SOLO aqui.
   *
   * Nada de `localStorage` ni `sessionStorage`: dura lo que dura la sesion y al
   * recargar se vuelve a preguntar. Con UNA asignacion no hay selector --el
   * shell ya escribio el binding-- y esta consulta ni se lanza, asi que el caso
   * de Mapaal sigue costando una sola peticion al contrato del contexto.
   */
  const [elegido, setElegido] = useState<string | null>(null);

  const asignaciones = useQuery({
    queryKey: ["dealer-assignments"],
    queryFn: fetchMyDealerContext,
    enabled: allowed && binding === null,
    staleTime: Infinity,
    retry: false,
  });

  const porElegir = binding === null ? (asignaciones.data ?? []) : [];
  const hayQueElegir = porElegir.length > 1 && elegido === null;
  const dealerId = binding ?? elegido;

  const inventory = useQuery({
    queryKey: ["dealer-private-inventory", dealerId ?? "none"],
    queryFn: () => fetchDealerInventory(dealerId as string),
    enabled: allowed && Boolean(dealerId),
    retry: false,
  });
  const visibles = filtrarInventario(inventory.data ?? [], filtros);

  const errorDeAcceso = access.error instanceof AccessApiError ? access.error : null;

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Tus vehículos: buscá, filtrá por estado y ordená la lista.
        </p>
        {/* Con el binding, no con el dealer elegido: la eleccion vive en el estado
            de ESTA pantalla y /nuevo no la ve; sin binding seria una puerta cerrada. */}
        {puedeCrear && binding !== null ? (
          <Link
            href="/autos/dealer/inventario/nuevo"
            data-testid="inventario-nuevo"
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-bold text-nk-fg"
          >
            Nuevo vehículo
          </Link>
        ) : null}
        {allowed && dealerId && !hayQueElegir ? (
          <Link
            href="/autos/dealer/inventario/importar"
            data-testid="inventario-importar"
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-brand-2 underline"
          >
            Importar planilla
          </Link>
        ) : null}
      </header>

      {cargando ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : errorDeAcceso ? (
        isAccessUnverified(errorDeAcceso.reason_code) ? (
          <SinVerificar codigo={errorDeAcceso.reason_code as string} />
        ) : (
          <section
            role="alert"
            data-testid="inventario-error-acceso"
            data-http-status={String(errorDeAcceso.status)}
            data-reason-code={errorDeAcceso.reason_code ?? ""}
            className={CAJA}
          >
            <p className="font-semibold">No se pudo verificar el acceso al inventario.</p>
            <p className="mt-1 text-nk-fg-muted">
              No pudimos confirmar si tu usuario tiene permiso para ver el inventario. Probá de nuevo en unos
              minutos; si sigue igual, avisá a soporte.
            </p>
            <DetalleTecnico>
              {errorDeAcceso.reason_code ? (
                <code>{errorDeAcceso.reason_code}</code>
              ) : (
                <>Respuesta HTTP {errorDeAcceso.status} sin código de motivo.</>
              )}
            </DetalleTecnico>
          </section>
        )
      ) : access.error ? (
        <section role="alert" data-testid="inventario-error-red" className={CAJA}>
          <p className="font-semibold">No se pudo verificar el acceso al inventario.</p>
          <p className="mt-1 text-nk-fg-muted">No pudimos conectarnos para revisar tus permisos. Probá de nuevo.</p>
        </section>
      ) : !decision ? (
        <section role="alert" data-testid="inventario-sin-decision" data-allowed="false" className={CAJA}>
          <p className="font-semibold">Inventario no disponible.</p>
          <p className="mt-1 text-nk-fg-muted">
            No pudimos confirmar si tu usuario puede ver el inventario. Probá de nuevo o avisá a soporte.
          </p>
          <DetalleTecnico>
            Sin decisión de acceso para <code>{CAPABILITY}</code>.
          </DetalleTecnico>
        </section>
      ) : !allowed ? (
        isAccessUnverified(decision.reason_code) ? (
          <SinVerificar codigo={decision.reason_code as string} />
        ) : (
          <section
            role="alert"
            data-testid="inventario-denegado"
            data-allowed="false"
            data-reason-code={decision.reason_code ?? ""}
            className={CAJA}
          >
            <p className="font-semibold">Inventario no disponible.</p>
            <p className="mt-1 text-nk-fg-muted">
              Tu usuario no tiene acceso al inventario. Si creés que es un error, pedile a quien administra tu
              cuenta que revise tus permisos.
            </p>
            <DetalleTecnico>
              {decision.reason_code ? <code>{decision.reason_code}</code> : <>Denegado sin motivo informado.</>}
            </DetalleTecnico>
          </section>
        )
      ) : binding === null && (asignaciones.isPending || asignaciones.isLoading) ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando tus concesionarios…</p>
      ) : binding === null && asignaciones.error ? (
        <section role="alert" data-testid="inventario-asignaciones-error" className={CAJA}>
          <p className="font-semibold">No se pudo leer tus concesionarios.</p>
          <p className="mt-1 text-nk-fg-muted">Probá de nuevo en unos minutos; si sigue igual, avisá a soporte.</p>
          {asignaciones.error instanceof AccessApiError && asignaciones.error.reason_code ? (
            <DetalleTecnico>
              <code>{asignaciones.error.reason_code}</code>
            </DetalleTecnico>
          ) : null}
        </section>
      ) : hayQueElegir ? (
        <section data-testid="inventario-selector-dealer" className={CAJA}>
          <h2 className="font-semibold">Elegí el concesionario</h2>
          <p className="mt-1 text-nk-fg-muted">
            Tu usuario está asignado a {porElegir.length}. No se elige uno por vos: sería mostrarte el
            inventario de otro. La elección dura esta sesión.
          </p>
          <ul className="mt-3 grid gap-2">
            {porElegir.map((asignacion) => (
              <li key={asignacion.dealerId}>
                <button
                  type="button"
                  data-dealer-id={asignacion.dealerId}
                  onClick={() => setElegido(asignacion.dealerId)}
                  className="inline-flex min-h-10 w-full items-center rounded-lg border border-nk-border px-3 text-left text-sm font-semibold text-nk-fg hover:bg-nk-surface-2"
                >
                  {asignacion.dealerName ?? asignacion.dealerId}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : !dealerId ? (
        <section role="status" data-testid="inventario-sin-dealer" className={CAJA}>
          <p className="font-semibold">No se pudo identificar el dealer de tu sesión.</p>
          <p className="mt-1 text-nk-fg-muted">
            Tenés el permiso, pero falta el dealer con el que pedir el inventario. Volvé a iniciar sesión o
            avisá a soporte.
          </p>
        </section>
      ) : inventory.isPending || inventory.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Cargando inventario…</p>
      ) : inventory.error ? (
        <section
          role="alert"
          data-testid="inventario-error"
          data-reason-code={
            inventory.error instanceof AccessApiError
              ? (inventory.error.reason_code ?? `HTTP_${inventory.error.status}`)
              : ""
          }
          className={CAJA}
        >
          <p className="font-semibold">No se pudo cargar el inventario privado.</p>
          {inventory.error instanceof AccessApiError ? (
            <>
              <p className="mt-1 text-nk-fg-muted">Probá de nuevo en unos minutos; si sigue igual, avisá a soporte.</p>
              <DetalleTecnico>
                <code>{inventory.error.reason_code ?? `HTTP_${inventory.error.status}`}</code>
              </DetalleTecnico>
            </>
          ) : null}
        </section>
      ) : (inventory.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-nk-border bg-nk-surface p-6 text-sm text-nk-fg-muted">
          Todavía no hay vehículos cargados en este concesionario.
        </div>
      ) : (
        <section className="space-y-3">
          <BarraInventario
            filtros={filtros}
            estados={estadosPresentes(inventory.data!, Object.keys(VEHICLE_STATUS_LABEL))}
            onChange={setFiltros}
          />
          {visibles.length === 0 ? (
            <p data-testid="inventario-sin-resultados" className="text-sm text-nk-fg-muted">
              Ningún vehículo coincide con la búsqueda.
            </p>
          ) : null}
        <ul data-testid="inventario-lista" data-cantidad={visibles.length} className="grid gap-3 md:grid-cols-2">
          {visibles.map((vehicle) => {
            const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.id;
            return (
              <li key={vehicle.id} className="rounded-xl border border-nk-border bg-nk-surface p-4">
                <p className="font-manrope font-bold text-nk-fg">{title}</p>
                <p className="mt-1 text-sm text-nk-fg-muted">
                  Estado: {vehicle.status ? (VEHICLE_STATUS_LABEL[vehicle.status] ?? vehicle.status) : "sin estado"}
                </p>
                {vehicle.plate || vehicle.stock_number ? (
                  <p className="mt-1 text-xs text-nk-fg-muted">
                    {[vehicle.plate && `Dominio ${vehicle.plate}`, vehicle.stock_number && `Stock ${vehicle.stock_number}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                <Link
                  href={`/autos/dealer/inventario/${encodeURIComponent(vehicle.id)}`}
                  className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-brand-2 underline"
                >
                  Ver ficha
                </Link>
              </li>
            );
          })}
        </ul>
        </section>
      )}
    </main>
  );
}
