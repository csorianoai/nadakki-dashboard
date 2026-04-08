"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CreditCard, CalendarClock, AlertCircle, ArrowUpRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getBillingStatus, type BillingStatus } from "@/lib/api/billing";

function formatRenewal(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(t));
}

function formatSubscriptionLabel(s: string | null): string {
  if (!s) return "—";
  const u = s.replace(/_/g, " ").toLowerCase();
  return u.charAt(0).toUpperCase() + u.slice(1);
}

export interface BillingDashboardProps {
  tenantId: string | null;
  /** Bump to refetch after checkout success */
  refreshKey?: number;
  /** Scroll / focus pricing */
  onUpgradeClick?: () => void;
}

export default function BillingDashboard({
  tenantId,
  refreshKey = 0,
  onUpgradeClick,
}: BillingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);

  const load = useCallback(async () => {
    const tid = tenantId?.trim() ?? "";
    if (!tid) {
      setLoading(false);
      setStatus(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const s = await getBillingStatus(tid);
      setStatus(s);
      if (!s) {
        setError(
          "No se pudo cargar el estado de facturación. Comprueba el tenant y el API."
        );
      }
    } catch {
      setError("Error de red al cargar facturación.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (!tenantId?.trim()) {
    return (
      <GlassCard className="p-6 border-white/10">
        <p className="text-gray-400 text-sm m-0">
          Selecciona una institución (tenant) en la barra superior para ver tu plan y
          suscripción.
        </p>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <GlassCard className="p-10 border-white/10 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        <span className="text-gray-400 text-sm">Cargando facturación…</span>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <GlassCard className="p-4 border-red-500/25 bg-red-500/10">
          <p className="text-red-200 text-sm m-0 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        </GlassCard>
      ) : null}

      <GlassCard className="p-6 border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <CreditCard className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white m-0 mb-1">
                Tu suscripción
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm m-0">
                <div>
                  <dt className="text-gray-500 m-0">Plan actual</dt>
                  <dd className="text-white font-medium m-0 mt-0.5 capitalize">
                    {status?.plan ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 m-0">Estado</dt>
                  <dd className="text-white font-medium m-0 mt-0.5">
                    {formatSubscriptionLabel(status?.subscription_status ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <dt className="text-gray-500 m-0 inline">Renovación</dt>
                    <dd className="text-white font-medium m-0 mt-0.5 inline sm:block sm:mt-0.5">
                      {formatRenewal(status?.current_period_end ?? null)}
                    </dd>
                  </div>
                </div>
                {status?.cancel_at_period_end ? (
                  <div className="sm:col-span-2 text-amber-200/90 text-xs">
                    La suscripción no se renovará al final del período actual.
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
