"use client";

import { DealerEntitlementGate } from "@/components/dealer/DealerEntitlementGate";
import {
  DEALER_INVENTORY_LIST_GET_IN_PRODUCTION_OPENAPI,
  DEALER_INVENTORY_LIST_PATH,
  PUBLIC_MARKETPLACE_SEARCH_PATH,
} from "@/lib/dealer/inventory-search";

export const DEALER_INVENTORY_CAPABILITY = "autos.inventory.view";

function InventorySurface() {
  if (DEALER_INVENTORY_LIST_GET_IN_PRODUCTION_OPENAPI) {
    return (
      <p className="text-sm text-nk-fg-muted">
        El GET autenticado está en OpenAPI; esta rama no lo llama todavía.
      </p>
    );
  }

  return (
    <section
      role="alert"
      data-testid="dealer-inventory-blocked-by-backend"
      data-blocked-by-backend="true"
      className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
    >
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Inventario no disponible</h2>
      <p className="mt-2 text-sm text-nk-fg-muted">
        BLOCKED_BY_BACKEND. El OpenAPI de producción no publica GET autenticado del inventario
        del dealer (todos los estados). No se usa la vitrina pública.
      </p>
      <p className="mt-3 text-sm text-nk-fg break-words">
        <code>{`GET ${DEALER_INVENTORY_LIST_PATH}`}</code>
      </p>
      <p className="mt-2 text-xs text-nk-fg-muted break-words">
        Fuera de fuente: <code>{`POST ${PUBLIC_MARKETPLACE_SEARCH_PATH}`}</code>
      </p>
    </section>
  );
}

export default function DealerInventarioPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Inventario autenticado del dealer. El marketplace público no es fuente.
        </p>
      </header>
      <DealerEntitlementGate capability={DEALER_INVENTORY_CAPABILITY}>
        {() => <InventorySurface />}
      </DealerEntitlementGate>
    </main>
  );
}
