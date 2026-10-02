"use client";

/**
 * "Primeros pasos" en el Inicio del dealer, cuando el inventario esta vacio (D9).
 *
 * El onboarding de Mapaal vive en el Centro Operativo (decision de Cesar), y
 * este bloque es la puerta: un dealer que entra sin stock no tiene que adivinar
 * por donde empezar.
 *
 * EL TEXTO NO SE ESCRIBE AQUI. Sale del mismo archivo de datos que la guia
 * --`app/centro-operativo/contenido.ts`, bloque `primeros-pasos`-- que es la
 * guia validada contablemente por Cesar. Duplicar aqui el titulo o los pasos
 * garantizaria que las dos copias se separen en la primera correccion, y una de
 * ellas seria la que el dealer lee para cargar su contabilidad. Lo unico propio
 * de este componente es la etiqueta del boton.
 *
 * CUANDO SE PINTA: solo cuando SABEMOS que el inventario esta vacio, o sea
 * cuando la consulta respondio bien y trajo cero vehiculos. Cargando, con
 * error, sin acceso verificado o sin dealer resuelto NO se pinta. Un fallo de
 * red no es un inventario vacio: ensenarle "Primeros pasos" a un dealer que ya
 * tiene stock cargado le diria que su trabajo se perdio.
 */

import Link from "next/link";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { contenidoCentroOperativo } from "@/app/centro-operativo/contenido";
import { AuthContext } from "@/lib/auth/auth-context";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

export const PRIMEROS_PASOS_CAPABILITY = "autos.inventory.list";

/** El destino: la seccion de primeros pasos de la guia, no el principio. */
export const PRIMEROS_PASOS_HREF = "/centro-operativo#primeros-pasos";

export const PRIMEROS_PASOS_BOTON = "Empezar: cargar mi stock";

export function PrimerosPasosInicio() {
  /**
   * `useContext` directo y NO `useAuth()`: ese hook lanza si no hay
   * `AuthProvider`, y eso convertiria todo el Inicio del dealer en rehen de un
   * provider que solo hace falta para elegir la guia. El tenant aqui es
   * opcional de verdad: `contenidoCentroOperativo` ya entrega la de Mapaal
   * cuando no lo hay, que es la unica validada contablemente.
   */
  const tenant = useContext(AuthContext)?.tenant ?? null;
  const access = useAccessEntitlementsBatch([PRIMEROS_PASOS_CAPABILITY]);
  const decision = access.data?.results[PRIMEROS_PASOS_CAPABILITY];
  const cargandoAcceso = access.isPending || access.isLoading;
  const allowed = !cargandoAcceso && !access.error && decision?.allowed === true;

  // Mismo criterio que la pantalla de Inventario: el binding solo construye la
  // peticion y no participa en la decision de acceso.
  const binding = selectedDealerIdentity()?.dealerId ?? null;

  const asignaciones = useQuery({
    queryKey: ["dealer-assignments"],
    queryFn: fetchMyDealerContext,
    enabled: allowed && binding === null,
    staleTime: Infinity,
    retry: false,
  });

  // Con varias asignaciones elige el usuario, y eso se hace en Inventario. Aqui
  // no se adivina de cual de los dealers hablamos.
  const unica = binding === null && (asignaciones.data ?? []).length === 1
    ? (asignaciones.data ?? [])[0]?.dealerId ?? null
    : null;
  const dealerId = binding ?? unica;

  const inventory = useQuery({
    queryKey: ["dealer-private-inventory", dealerId ?? "none"],
    queryFn: () => fetchDealerInventory(dealerId as string),
    enabled: allowed && Boolean(dealerId),
    retry: false,
  });

  // La unica condicion que enciende el bloque: respuesta buena y cero vehiculos.
  const vacioConfirmado = inventory.isSuccess && (inventory.data?.length ?? 0) === 0;
  if (!vacioConfirmado) return null;

  const bloque = contenidoCentroOperativo(tenant?.id).bloques.find(
    (b) => b.id === "primeros-pasos",
  );
  if (!bloque) return null;

  return (
    <section
      data-testid="dealer-primeros-pasos"
      aria-labelledby="primeros-pasos-titulo"
      className="rounded-xl border border-brand-2/40 bg-brand-2/10 p-5"
    >
      <div className="flex items-start gap-3">
        <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand-2" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-2">
            Primeros pasos
          </p>
          <h2
            id="primeros-pasos-titulo"
            className="mt-1 font-manrope text-base font-bold text-nk-fg"
          >
            {bloque.titulo}
          </h2>

          {bloque.pasos?.length ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-nk-fg-muted">
              {bloque.pasos.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
          ) : null}

          <Link
            href={PRIMEROS_PASOS_HREF}
            data-testid="dealer-primeros-pasos-cta"
            className="mt-4 inline-block rounded-full bg-brand-2 px-4 py-2 text-sm font-semibold text-nk-bg hover:opacity-90"
          >
            {PRIMEROS_PASOS_BOTON}
          </Link>
        </div>
      </div>
    </section>
  );
}
