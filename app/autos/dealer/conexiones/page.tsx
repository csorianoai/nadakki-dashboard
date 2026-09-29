"use client";

import { useQuery } from "@tanstack/react-query";
import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";
import { BloqueEstadoView } from "@/components/dealer-management/inicio/BloqueEstado";
import { getAccessClientContext } from "@/lib/access/client";
import { fetchCommercialSponsorships } from "@/lib/access/sponsorship";
import type { BloqueEstado } from "@/lib/dealer-management/bloque-estado";

/**
 * Conexiones. Antes la pantalla quedaba EN BLANCO: solo el titulo mas un banner
 * que devuelve null en tres ramas distintas (sin contexto, con error y sin
 * lineas). Ahora cada caso se declara segun la tabla 1 de avisos.
 *
 * No hay catalogo de integraciones en el backend: lo unico real es el
 * patrocinio comercial que expone lib/access/sponsorship. El resto no se
 * inventa. (La URL no se escribe aqui: la fija DASH-ACCESS-ADOPTION-01.)
 */
export default function DealerConexionesPage() {
  const contexto = getAccessClientContext();

  const patrocinios = useQuery({
    queryKey: ["dealer-conexiones-sponsorship", contexto?.tenantId ?? "none", contexto?.dealerId ?? "none"],
    queryFn: () => fetchCommercialSponsorships(contexto),
    enabled: contexto != null,
    retry: false,
    staleTime: 60_000,
  });

  const estado: BloqueEstado = !contexto
    ? { caso: "error" }
    : patrocinios.isPending || patrocinios.isLoading
      ? { caso: "cargando" }
      : patrocinios.isError
        ? { caso: "error" }
        : (patrocinios.data?.length ?? 0) === 0
          ? {
              caso: "vacio",
              motivo:
                "No tienes integraciones ni patrocinios activos. Cuando un banco o un portal se conecte con tu concesionaria, aparecerá aquí.",
              accion: { texto: "Ver estado de módulos", href: "/autos/dealer/estado" },
            }
          : { caso: "ok" };

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-dealer-display text-2xl font-extrabold text-[var(--fg)]">Conexiones</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Integraciones y patrocinios reportados para tu concesionaria.
        </p>
      </header>

      <div className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        {estado.caso === "ok" ? (
          <DealerSponsorshipBanner />
        ) : (
          <BloqueEstadoView
            estado={estado}
            titulo="Conexiones"
            onReintentar={() => void patrocinios.refetch()}
          />
        )}
      </div>
    </main>
  );
}
