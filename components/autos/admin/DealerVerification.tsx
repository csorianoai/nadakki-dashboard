"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import {
  AutosAdminApiError,
  fetchPendingDealers,
  updateDealerVerification,
} from "@/lib/autos-portal/admin-api";
import { seedPendingDealers } from "@/lib/autos-portal/admin-demo-data";
import { loadAdminDealers, saveAdminDealers } from "@/lib/autos-portal/admin-session-store";
import type { AdminDealerRow } from "@/lib/autos-portal/admin-types";
import { TENANTS, type TenantSlug } from "@/lib/tenants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DealerVerification({ tenantSlug }: { tenantSlug: TenantSlug }) {
  const tenantId = TENANTS[tenantSlug].tenantId;
  const [dealers, setDealers] = useState<AdminDealerRow[]>([]);
  const [selected, setSelected] = useState<AdminDealerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchPendingDealers(tenantId);
      if (remote) {
        setDealers(remote.filter((d) => d.kyc_status !== "verified"));
        setDemoMode(false);
      } else {
        const seed = seedPendingDealers(tenantSlug);
        setDealers(loadAdminDealers(tenantId, seed));
        setDemoMode(true);
      }
    } catch {
      const seed = seedPendingDealers(tenantSlug);
      setDealers(loadAdminDealers(tenantId, seed));
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyStatus = async (
    dealerId: string,
    new_status: AdminDealerRow["kyc_status"],
    actionLabel: string,
  ) => {
    setBusy(true);
    try {
      await updateDealerVerification(tenantId, dealerId, {
        new_status,
        reason: reason.trim() || null,
      });
      toast.success(actionLabel);
    } catch (e) {
      if (!(e instanceof AutosAdminApiError) || e.status !== 404) {
        toast.error(e instanceof Error ? e.message : "Error de verificación");
        setBusy(false);
        return;
      }
      toast.message("Modo demo — verificación guardada localmente");
    }
    const next = dealers.filter((d) => d.id !== dealerId);
    setDealers(next);
    saveAdminDealers(tenantId, next);
    setSelected(null);
    setBusy(false);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando dealers pendientes…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          Verificación de dealers ({dealers.length})
        </h2>
        <DemoModeBadge visible={demoMode} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          {dealers.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelected(d)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50",
                  selected?.id === d.id && "bg-blue-50 font-semibold",
                )}
              >
                {d.name}
                <span className="block text-xs uppercase text-gray-500">{d.kyc_status}</span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
            <h3 className="text-xl font-bold">{selected.name}</h3>
            <p className="text-sm text-gray-600">{selected.email}</p>
            <p className="mt-2 text-xs text-gray-500">
              KYC: {selected.kyc_status} · Alta:{" "}
              {new Date(selected.created_at).toLocaleDateString("es-DO")}
            </p>
            <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              Documentos KYC: disponibles en backend dealer-bank (vista demo).
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (rechazo / suspensión)"
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void applyStatus(selected.id, "verified", "Dealer verificado")}
              >
                Aprobar (VERIFIED)
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void applyStatus(selected.id, "rejected", "Dealer rechazado")}
              >
                Rechazar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void applyStatus(selected.id, "suspended", "Dealer suspendido")}
              >
                Suspender
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 p-8 text-sm text-gray-500 lg:col-span-2">
            Selecciona un dealer
          </div>
        )}
      </div>
    </div>
  );
}
