"use client";

import { useQuery } from "@tanstack/react-query";
import { DealerEntitlementGate, DealerReasonPanel } from "@/components/dealer/DealerEntitlementGate";
import { AccessApiError } from "@/lib/access/client";
import { fetchDealerSocialConnections } from "@/lib/dealer/social-connections";

/** Catalogued marketing key; viewing connections still goes through batch, not a invented capability. */
export const DEALER_CONNECTIONS_CAPABILITY = "marketing.social.publish";

function ConnectionsList() {
  const query = useQuery({
    queryKey: ["dealer-social-connections"],
    queryFn: fetchDealerSocialConnections,
    retry: false,
  });

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-connections-loading">
        Cargando conexiones…
      </p>
    );
  }

  if (query.error instanceof AccessApiError) {
    return (
      <DealerReasonPanel
        reason_code={query.error.reason_code ?? `HTTP_${query.error.status}`}
        httpStatus={query.error.status}
      />
    );
  }

  if (query.error) {
    return <DealerReasonPanel reason_code="DEFAULT_DENY" />;
  }

  const rows = query.data ?? [];
  if (rows.length === 0) {
    return (
      <p data-testid="dealer-connections-empty" className="text-sm text-nk-fg-muted">
        El backend no devolvió conexiones sociales para este tenant.
      </p>
    );
  }

  return (
    <ul className="grid max-w-full gap-3 overflow-x-hidden" data-testid="dealer-connections-ready">
      {rows.map((row) => (
        <li
          key={row.platform}
          className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <p className="font-manrope text-base font-bold text-nk-fg break-words">{row.platform}</p>
          <p className="mt-1 text-sm text-nk-fg-muted">
            {row.connected ? "Conectada" : "No conectada"}
          </p>
          {row.account ? <p className="text-sm text-nk-fg break-words">{row.account}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default function DealerConexionesPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Conexiones</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Estado social del tenant autenticado. No se listan plataformas que el backend no envió.
        </p>
      </header>
      <DealerEntitlementGate capability={DEALER_CONNECTIONS_CAPABILITY}>
        {() => <ConnectionsList />}
      </DealerEntitlementGate>
    </main>
  );
}
