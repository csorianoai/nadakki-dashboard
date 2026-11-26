"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getAccessClientContext } from "@/lib/access/client";
import { fetchPostSaleSnapshot, type PostSaleParte } from "@/lib/dealer/post-sale";

/** Texto para el dueno cuando una parte no se leyo: nunca un reason_code ni un detalle tecnico. */
const TEXTO_FALLO: Record<Exclude<PostSaleParte<unknown>["estado"], "ok">, string> = {
  no_incluido: "No incluido en tu plan.",
  sin_datos: "Sin datos todavía.",
  error: "No se pudo leer esta parte. Prueba de nuevo en unos minutos.",
};

function Parte<T>({
  id,
  titulo,
  parte,
  children,
}: {
  id: string;
  titulo: string;
  parte: PostSaleParte<T>;
  children: (datos: T) => ReactNode;
}) {
  return (
    <div data-testid={`dealer-post-sale-${id}`} data-estado={parte.estado}>
      <h3 className="text-sm font-semibold text-nk-fg">{titulo}</h3>
      {parte.estado !== "ok" ? (
        <p className="text-sm text-nk-fg-muted">{TEXTO_FALLO[parte.estado]}</p>
      ) : (
        children(parte.datos)
      )}
    </div>
  );
}

function Lista({ filas }: { filas: { id: string; texto: string | null }[] }) {
  return (
    <ul className="text-sm text-nk-fg">
      {filas.map((row) => (
        <li key={row.id} className="break-words">
          {row.id}
          {row.texto ? ` · ${row.texto}` : ""}
        </li>
      ))}
    </ul>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="text-sm text-nk-fg-muted">{texto}</p>;
}

export function DealerPostSaleCores() {
  const context = getAccessClientContext();
  const tenantId = context?.tenantId ?? "";
  const dealerId = context?.dealerId ?? null;
  const query = useQuery({
    queryKey: ["dealer-post-sale", tenantId, dealerId ?? "none"],
    queryFn: () => fetchPostSaleSnapshot(tenantId, dealerId),
    enabled: tenantId.length > 0,
    retry: false,
  });

  if (!tenantId) return null;

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-post-sale-loading">
        Cargando estado post-venta…
      </p>
    );
  }

  const data = query.data;
  const partes = data ? [data.cases, data.asientos, data.listings, data.heartbeat] : [];
  // Solo si no se pudo leer NINGUNA parte se muestra el aviso general (sin detalle tecnico).
  if (query.error || !data || partes.every((p) => p.estado === "error")) {
    return (
      <section
        role="alert"
        data-testid="dealer-post-sale-error"
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo leer el estado post-venta</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Prueba de nuevo en unos minutos; si sigue igual, avisa a soporte.
        </p>
      </section>
    );
  }

  const empty =
    data.cases.estado === "ok" && data.cases.datos.length === 0 &&
    data.asientos.estado === "ok" && data.asientos.datos.length === 0 &&
    data.listings.estado === "ok" && data.listings.datos.length === 0 &&
    data.heartbeat.estado === "ok" && Object.keys(data.heartbeat.datos).length === 0;

  if (empty) {
    return (
      <p data-testid="dealer-post-sale-empty" className="text-sm text-nk-fg-muted">
        Legal, Contable y Marketing no devolvieron filas post-venta.
      </p>
    );
  }

  return (
    <section
      data-testid="dealer-post-sale-ready"
      className="max-w-full space-y-3 overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
    >
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Tras una venta</h2>
      <Parte id="legal" titulo="Legal — expediente abierto" parte={data.cases}>
        {(cases) =>
          cases.length === 0 ? <Vacio texto="Sin expedientes abiertos." /> : <Lista filas={cases.map((r) => ({ id: r.id, texto: r.state }))} />
        }
      </Parte>
      <Parte id="contable" titulo="Contable — asiento registrado" parte={data.asientos}>
        {(asientos) =>
          asientos.length === 0 ? <Vacio texto="Sin asientos." /> : <Lista filas={asientos.map((r) => ({ id: r.id, texto: r.status }))} />
        }
      </Parte>
      <Parte id="anuncios" titulo="Marketing — anuncio" parte={data.listings}>
        {(listings) =>
          listings.length === 0 ? (
            <Vacio texto="Sin anuncios en el inventario dealer." />
          ) : (
            <Lista filas={listings.map((r) => ({ id: r.id, texto: r.status }))} />
          )
        }
      </Parte>
      <Parte id="latido" titulo="Scheduler heartbeat" parte={data.heartbeat}>
        {(heartbeat) => {
          const keys = Object.keys(heartbeat);
          return keys.length === 0 ? (
            <Vacio texto="Sin campos en el latido." />
          ) : (
            <ul className="text-sm text-nk-fg">
              {keys.map((key) => (
                <li key={key} className="break-words">
                  {key}: {String(heartbeat[key])}
                </li>
              ))}
            </ul>
          );
        }}
      </Parte>
    </section>
  );
}
