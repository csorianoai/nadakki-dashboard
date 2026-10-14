"use client";

import { useQuery } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { fetchPostSaleSnapshot } from "@/lib/dealer/post-sale";

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

  if (query.error instanceof AccessApiError || query.error) {
    const access = query.error instanceof AccessApiError ? query.error : null;
    return (
      <section
        role="alert"
        data-testid="dealer-post-sale-error"
        data-reason-code={access?.reason_code ?? "DEFAULT_DENY"}
        data-http-status={access ? String(access.status) : undefined}
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo leer el estado post-venta</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Probá de nuevo en unos minutos; si sigue igual, avisá a soporte.
        </p>
        <details className="mt-1 text-xs text-nk-fg-muted">
          <summary className="cursor-pointer">Detalle técnico</summary>
          <code>{access?.reason_code ?? "DEFAULT_DENY"}</code>
        </details>
      </section>
    );
  }

  const data = query.data;
  if (!data) return null;
  const heartbeatKeys = Object.keys(data.heartbeat);
  const empty =
    data.cases.length === 0 &&
    data.asientos.length === 0 &&
    data.listings.length === 0 &&
    heartbeatKeys.length === 0;

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
      <div>
        <h3 className="text-sm font-semibold text-nk-fg">Legal — expediente abierto</h3>
        {data.cases.length === 0 ? (
          <p className="text-sm text-nk-fg-muted">Sin expedientes abiertos.</p>
        ) : (
          <ul className="text-sm text-nk-fg">
            {data.cases.map((row) => (
              <li key={row.id} className="break-words">
                {row.id}
                {row.state ? ` · ${row.state}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-nk-fg">Contable — asiento registrado</h3>
        {data.asientos.length === 0 ? (
          <p className="text-sm text-nk-fg-muted">Sin asientos.</p>
        ) : (
          <ul className="text-sm text-nk-fg">
            {data.asientos.map((row) => (
              <li key={row.id} className="break-words">
                {row.id}
                {row.status ? ` · ${row.status}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-nk-fg">Marketing — anuncio</h3>
        {data.listings.length === 0 ? (
          <p className="text-sm text-nk-fg-muted">Sin anuncios en el inventario dealer.</p>
        ) : (
          <ul className="text-sm text-nk-fg">
            {data.listings.map((row) => (
              <li key={row.id} className="break-words">
                {row.id}
                {row.status ? ` · ${row.status}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-nk-fg">Scheduler heartbeat</h3>
        {heartbeatKeys.length === 0 ? (
          <p className="text-sm text-nk-fg-muted">Sin campos en el latido.</p>
        ) : (
          <ul className="text-sm text-nk-fg">
            {heartbeatKeys.map((key) => (
              <li key={key} className="break-words">
                {key}: {String(data.heartbeat[key])}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
