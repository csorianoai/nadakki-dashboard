"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DealerEntitlementGate, DealerReasonPanel } from "@/components/dealer/DealerEntitlementGate";
import { AccessApiError } from "@/lib/access/client";
import { fetchDealerInventory } from "@/lib/dealer/inventory-search";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";

export const DEALER_INVENTORY_CAPABILITY = "autos.inventory.view";

function InventoryList() {
  const resolved = resolveDealerAccessContext();
  const ready = resolved.status === "ready" ? resolved.context : null;
  const query = useQuery({
    queryKey: ["dealer-inventory", ready?.tenantId ?? "none", ready?.dealerId ?? "none"],
    queryFn: () => fetchDealerInventory(ready!.tenantId, ready!.dealerId),
    enabled: ready != null,
    retry: false,
  });

  if (!ready) {
    const reason =
      resolved.status === "ready" ? "DEFAULT_DENY" : resolved.reason_code;
    return <DealerReasonPanel reason_code={reason} />;
  }

  if (query.isPending || query.isLoading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-inventory-loading">
        Cargando inventario…
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
      <p data-testid="dealer-inventory-empty" className="text-sm text-nk-fg-muted">
        No hay vehículos de este dealer en la respuesta del backend.
      </p>
    );
  }

  return (
    <ul className="grid max-w-full gap-3 overflow-x-hidden" data-testid="dealer-inventory-ready">
      {rows.map((row) => {
        const title = [row.year, row.make, row.model].filter(Boolean).join(" ") || row.id;
        return (
          <li
            key={row.id}
            className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
          >
            <p className="font-manrope text-base font-bold text-nk-fg break-words">{title}</p>
            <p className="mt-1 text-sm text-nk-fg-muted">
              Estado: {row.status ?? "no disponible"}
            </p>
            {row.mileage_km != null ? (
              <p className="text-sm text-nk-fg-muted">Km: {row.mileage_km.toLocaleString("es-DO")}</p>
            ) : null}
            {row.price_rd != null ? (
              <p className="text-sm text-nk-fg">RD$ {row.price_rd.toLocaleString("es-DO")}</p>
            ) : null}
            <Link
              href={`/autos/vehiculo/${encodeURIComponent(row.id)}`}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-2 underline"
            >
              Ver ficha
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function DealerInventarioPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Vehículos de tu dealer. Solo filas cuyo tenant y dealer coinciden con tu contexto.
        </p>
      </header>
      <DealerEntitlementGate capability={DEALER_INVENTORY_CAPABILITY}>
        {() => <InventoryList />}
      </DealerEntitlementGate>
    </main>
  );
}
