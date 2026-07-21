"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import {
  AutosAdminApiError,
  fetchPendingVehicles,
  moderateVehicleListing,
} from "@/lib/autos-portal/admin-api";
import { seedPendingVehicles } from "@/lib/autos-portal/admin-demo-data";
import { loadAdminVehicles, saveAdminVehicles } from "@/lib/autos-portal/admin-session-store";
import type { AdminVehicleRow } from "@/lib/autos-portal/admin-types";
import { fmtKm, fmtRD } from "@/lib/format";
import { TENANT_OPTIONS, TENANTS, type TenantSlug } from "@/lib/tenants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VehicleModeration({ tenantSlug }: { tenantSlug: TenantSlug }) {
  const tenantId = TENANTS[tenantSlug].tenantId;
  const [vehicles, setVehicles] = useState<AdminVehicleRow[]>([]);
  const [selected, setSelected] = useState<AdminVehicleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchPendingVehicles(tenantId);
      if (remote) {
        setVehicles(remote);
        setDemoMode(false);
      } else {
        const seed = seedPendingVehicles(tenantSlug);
        setVehicles(loadAdminVehicles(tenantId, seed));
        setDemoMode(true);
      }
    } catch {
      const seed = seedPendingVehicles(tenantSlug);
      setVehicles(loadAdminVehicles(tenantId, seed));
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const finishAction = (vehicleId: string, next: AdminVehicleRow[]) => {
    setVehicles(next);
    saveAdminVehicles(tenantId, next);
    if (selected?.id === vehicleId) setSelected(null);
  };

  const runModeration = async (
    vehicleId: string,
    action: "approved" | "rejected" | "flagged",
    reason?: string,
  ) => {
    setBusy(true);
    try {
      await moderateVehicleListing(tenantId, vehicleId, { action, reason: reason ?? null });
      toast.success(action === "approved" ? "Vehículo aprobado" : "Acción registrada");
    } catch (e) {
      if (!(e instanceof AutosAdminApiError) || e.status !== 404) {
        toast.error(e instanceof Error ? e.message : "Error de moderación");
        setBusy(false);
        return;
      }
      toast.message("Modo demo — acción guardada localmente");
    }
    const next = vehicles.filter((v) => v.id !== vehicleId);
    finishAction(vehicleId, next);
    setBusy(false);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando vehículos pendientes…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          Moderación de vehículos ({vehicles.length})
        </h2>
        <DemoModeBadge visible={demoMode} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 lg:col-span-1">
          {vehicles.length === 0 ? (
            <li className="text-sm text-gray-500">Sin vehículos pendientes</li>
          ) : (
            vehicles.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelected(v)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-gray-50",
                    selected?.id === v.id && "bg-blue-50 font-semibold text-blue-900",
                  )}
                >
                  <span className="block">{v.name}</span>
                  <span className="text-xs text-gray-500">{v.status}</span>
                </button>
              </li>
            ))
          )}
        </ul>

        {selected ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
            <h3 className="text-xl font-bold">{selected.name}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.image_url}
              alt=""
              className="my-3 h-56 w-full rounded-md object-cover bg-gray-100"
            />
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Precio</dt>
                <dd className="font-semibold">{fmtRD(selected.price)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Dealer</dt>
                <dd>{selected.dealer_name ?? selected.dealer_id}</dd>
              </div>
              {selected.km != null ? (
                <div>
                  <dt className="text-gray-500">Km</dt>
                  <dd>{fmtKm(selected.km)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo de rechazo (opcional)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void runModeration(selected.id, "approved")}
                >
                  Aprobar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void runModeration(selected.id, "flagged", "Revisión manual")}
                >
                  Solicitar cambios
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    void runModeration(
                      selected.id,
                      "rejected",
                      rejectReason.trim() || "Calidad insuficiente",
                    )
                  }
                >
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 p-8 text-sm text-gray-500 lg:col-span-2">
            Selecciona un vehículo para revisar
          </div>
        )}
      </div>
    </div>
  );
}
