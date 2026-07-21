"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/components/autos/CartProvider";
import { Button } from "@/components/ui/button";
import { fmtKm, fmtRD } from "@/lib/format";
import type { CartVehicle } from "@/lib/autos-portal/cart-types";
import { MAX_COMPARE_VEHICLES } from "@/lib/autos-portal/cart-types";
import { cn } from "@/lib/utils";

function CompareTable({ vehicles }: { vehicles: CartVehicle[] }) {
  if (vehicles.length === 0) return null;

  const rows: { label: string; values: (string | number)[] }[] = [
    { label: "Precio", values: vehicles.map((v) => fmtRD(v.vehicle_price)) },
    { label: "Año", values: vehicles.map((v) => v.year ?? "—") },
    { label: "Km", values: vehicles.map((v) => (v.km != null ? fmtKm(v.km) : "—")) },
    { label: "Combustible", values: vehicles.map((v) => v.fuel ?? "—") },
    { label: "Transmisión", values: vehicles.map((v) => v.trans ?? "—") },
    { label: "Tipo", values: vehicles.map((v) => v.type ?? "—") },
    {
      label: "Características",
      values: vehicles.map((v) => v.features ?? "—"),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-r border border-nk-border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-nk-border bg-nk-surface-2">
            <th className="px-3 py-2 text-left font-semibold text-nk-fg-muted">Atributo</th>
            {vehicles.map((v) => (
              <th key={v.vehicle_id} className="min-w-[140px] px-3 py-2 text-left font-semibold">
                <Link href={`/autos/vehiculo/${encodeURIComponent(v.vehicle_id)}`} className="text-brand hover:underline">
                  {v.vehicle_name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-nk-border last:border-0">
              <td className="px-3 py-2 font-medium text-nk-fg-muted">{row.label}</td>
              {row.values.map((val, i) => (
                <td key={`${row.label}-${i}`} className="px-3 py-2 text-nk-fg">
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparePanel({
  onShare,
  className,
  showVehicleList = true,
}: {
  onShare?: (url: string) => void;
  className?: string;
  showVehicleList?: boolean;
}) {
  const cart = useCartStore();
  const compareVehicles = cart.getCompareVehicles();
  const atCompareLimit = cart.compareCount() >= MAX_COMPARE_VEHICLES;

  const handleShare = async () => {
    const url = cart.generateShareUrl();
    if (!url) {
      toast.error("No se pudo generar enlace de comparación");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada al portapapeles");
    } catch {
      toast.message("Comparación guardada", { description: url });
    }
    onShare?.(url);
  };

  return (
    <section className={cn("rounded-r border border-nk-border bg-nk-surface p-4 shadow-nk-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-manrope text-lg font-extrabold text-nk-fg">Comparar vehículos</h2>
          <p className="text-xs text-nk-fg-muted">Selecciona hasta {MAX_COMPARE_VEHICLES} vehículos del carrito</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            data-testid="compare-toggle"
            checked={cart.cart.compare_enabled}
            onChange={() => cart.toggleCompare()}
            className="h-4 w-4 rounded border-nk-border text-brand focus:ring-brand"
          />
          Modo comparación
        </label>
      </div>

      {showVehicleList && cart.getCart().length > 0 ? (
        <ul className="mt-4 space-y-2">
          {cart.getCart().map((v) => {
            const selected = cart.cart.compare_ids.includes(v.vehicle_id);
            return (
              <li
                key={v.vehicle_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-r-sm border border-nk-border px-3 py-2"
              >
                <span className="text-sm font-medium">{v.vehicle_name}</span>
                <label className="flex items-center gap-2 text-xs text-nk-fg-muted">
                  <input
                    type="checkbox"
                    data-testid="compare-checkbox"
                    checked={selected}
                    disabled={!cart.cart.compare_enabled || (!selected && atCompareLimit)}
                    onChange={() => {
                      if (selected) cart.removeFromCompare(v.vehicle_id);
                      else cart.addToCompare(v.vehicle_id);
                    }}
                  />
                  Comparar
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      {cart.cart.compare_enabled && compareVehicles.length >= 2 ? (
        <div className="mt-4 space-y-3" data-testid="comparison-table">
          <CompareTable vehicles={compareVehicles} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="brand" size="sm" onClick={() => void handleShare()}>
              Compartir comparación
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => cart.clearCompare()}>
              Limpiar comparación
            </Button>
            <Link href="/autos/compare">
              <span className="inline-flex h-8 items-center rounded-md border border-nk-border px-3 text-xs font-medium hover:bg-nk-surface-2">
                Ver página de comparación
              </span>
            </Link>
          </div>
        </div>
      ) : cart.cart.compare_enabled ? (
        <p className="mt-4 text-sm text-nk-fg-muted">Selecciona al menos 2 vehículos para comparar.</p>
      ) : null}
    </section>
  );
}
