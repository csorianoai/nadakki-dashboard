"use client";

import useSWR from "swr";
import { motion } from "@/lib/motion-stub";
import { Loader2, RefreshCw, Beaker, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchObservabilityAuditTrail } from "@/lib/admin/observability-api";
import { demoAuditTrail } from "@/lib/admin/observability-demo";
import { AuditTrailTable } from "@/components/admin/observability/AuditTrailTable";

export default function AdminObservabilityAuditTrailPage() {
  const { tenantId } = useTenant();
  const { role } = useAuth();
  const roleStr = String(role ?? "");
  const key = tenantId?.trim() ? (["obs-audit", tenantId, roleStr] as const) : null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(key, async ([, tid]) => fetchObservabilityAuditTrail(tid, roleStr), {
    revalidateOnMount: true,
  });

  const bootstrapping = Boolean(tenantId?.trim() && isLoading && data === undefined);
  const demoMode = Boolean(
    tenantId?.trim() &&
      !bootstrapping &&
      (data === null || !Array.isArray(data?.events)),
  );

  const payload = demoMode ? demoAuditTrail() : data;
  const rows = payload?.events ?? [];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Audit trail</h1>
        <p className="mt-1 text-gray-400">
          Eventos administrativos y de producto. API:{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-300">
            GET /api/v1/tenants/&#123;id&#125;/observability/audit-trail
          </code>{" "}
          · Encabezado <code lang="en">X-Role</code> incluido en automático
        </p>
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {demoMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            <Beaker className="h-3.5 w-3.5" aria-hidden />
            Modo demostración
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={!tenantId || bootstrapping}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </button>
      </div>

      {bootstrapping && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-violet-400" />
        </div>
      )}

      {!bootstrapping && !tenantId && (
        <GlassCard className="border-white/10 p-8">
          <p className="m-0 text-gray-400">Selecciona un tenant para ver el trail.</p>
        </GlassCard>
      )}

      {!bootstrapping && tenantId && error && (
        <GlassCard className="mb-6 border-amber-500/25 bg-amber-500/5 p-4">
          <p className="m-0 flex items-start gap-2 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            No se pudo leer el API; mostrando datos de demostración.
          </p>
        </GlassCard>
      )}

      {!bootstrapping && tenantId && payload && (
        <div className="space-y-4">
          <AuditTrailTable rows={rows} pageSize={6} />
          {payload.fetched_at ? (
            <p className="text-center text-xs text-gray-500">
              Última actualización: {new Date(payload.fetched_at).toLocaleString("es-ES")}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
