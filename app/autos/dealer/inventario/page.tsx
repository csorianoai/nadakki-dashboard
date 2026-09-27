"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

const CAPABILITY = "autos.inventory.list";

export default function DealerInventoryPage() {
  const resolved = resolveDealerAccessContext();
  const context = resolved.status === "ready" ? resolved.context : null;
  const access = useAccessEntitlementsBatch([CAPABILITY]);
  const allowed = !access.isLoading && !access.error && access.data?.results[CAPABILITY]?.allowed === true;
  const inventory = useQuery({ queryKey: ["dealer-private-inventory", context?.dealerId ?? "none"], queryFn: () => fetchDealerInventory(context!.dealerId), enabled: Boolean(context && allowed), retry: false });

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Inventario</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">Inventario privado del dealer autenticado. No usa la vitrina pública ni filtra autoridad en cliente.</p>
      </header>
      {!context ? (
        <div role="alert" className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg">Inventario bloqueado: {resolved.reason_code}</div>
      ) : access.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : !allowed ? (
        <div role="alert" className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg">Inventario bloqueado: {access.data?.results[CAPABILITY]?.reason_code ?? "DEFAULT_DENY"}</div>
      ) : inventory.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Cargando inventario…</p>
      ) : inventory.error ? (
        <div role="alert" className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg">No se pudo cargar el inventario privado.</div>
      ) : (inventory.data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-nk-border bg-nk-surface p-6 text-sm text-nk-fg-muted">No hay vehículos reportados por el contrato privado para este dealer.</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {inventory.data!.map((vehicle) => {
            const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.id;
            return <li key={vehicle.id} className="rounded-xl border border-nk-border bg-nk-surface p-4">
              <p className="font-manrope font-bold text-nk-fg">{title}</p>
              <p className="mt-1 text-sm text-nk-fg-muted">Estado: {vehicle.status ?? "No reportado"}</p>
              <Link href={`/autos/dealer/inventario/${encodeURIComponent(vehicle.id)}`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-brand-2 underline">Ver ficha</Link>
            </li>;
          })}
        </ul>
      )}
    </main>
  );
}
