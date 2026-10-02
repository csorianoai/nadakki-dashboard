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
import { useQuery } from "@tanstack/react-query";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
  isAccessUnverified,
} from "@/lib/access/reason-codes";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

const CAPABILITY = "autos.inventory.list";

const CAJA = "rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg";

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
  const access = useAccessEntitlementsBatch([CAPABILITY]);
  const decision = access.data?.results[CAPABILITY];
  const cargando = access.isPending || access.isLoading;
  const allowed = !cargando && !access.error && decision?.allowed === true;

  /** Solo para construir la peticion. No participa en la decision de acceso. */
  const dealerId = selectedDealerIdentity()?.dealerId ?? null;

  const inventory = useQuery({
    queryKey: ["dealer-private-inventory", dealerId ?? "none"],
    queryFn: () => fetchDealerInventory(dealerId as string),
    enabled: allowed && Boolean(dealerId),
    retry: false,
  });

  const errorDeAcceso = access.error instanceof AccessApiError ? access.error : null;

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Inventario privado del dealer autenticado. No usa la vitrina pública ni filtra autoridad en cliente.
        </p>
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
              {errorDeAcceso.reason_code ? (
                <>
                  reason_code: <code>{errorDeAcceso.reason_code}</code>
                </>
              ) : (
                <>El backend respondió HTTP {errorDeAcceso.status} sin reason_code.</>
              )}
            </p>
          </section>
        )
      ) : access.error ? (
        <section role="alert" data-testid="inventario-error-red" className={CAJA}>
          <p className="font-semibold">No se pudo verificar el acceso al inventario.</p>
          <p className="mt-1 text-nk-fg-muted">La consulta de permisos no llegó a responder.</p>
        </section>
      ) : !decision ? (
        <section role="alert" data-testid="inventario-sin-decision" data-allowed="false" className={CAJA}>
          <p className="font-semibold">Inventario no disponible.</p>
          <p className="mt-1 text-nk-fg-muted">
            El backend no devolvió una decisión para <code>{CAPABILITY}</code>.
          </p>
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
              {decision.reason_code ? (
                <>
                  reason_code: <code>{decision.reason_code}</code>
                </>
              ) : (
                <>El backend denegó sin indicar motivo.</>
              )}
            </p>
          </section>
        )
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
            <p className="mt-1 text-nk-fg-muted">
              reason_code: <code>{inventory.error.reason_code ?? `HTTP_${inventory.error.status}`}</code>
            </p>
          ) : null}
        </section>
      ) : (inventory.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-nk-border bg-nk-surface p-6 text-sm text-nk-fg-muted">
          No hay vehículos reportados por el contrato privado para este dealer.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {inventory.data!.map((vehicle) => {
            const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.id;
            return (
              <li key={vehicle.id} className="rounded-xl border border-nk-border bg-nk-surface p-4">
                <p className="font-manrope font-bold text-nk-fg">{title}</p>
                <p className="mt-1 text-sm text-nk-fg-muted">Estado: {vehicle.status ?? "No reportado"}</p>
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
      )}
    </main>
  );
}
