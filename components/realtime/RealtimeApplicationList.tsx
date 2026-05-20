"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { isRealtimeFeatureEnabled } from "@/lib/realtime/websocket-client";
import { LiveActivityIndicator, type LiveActivityMode } from "@/components/realtime/LiveActivityIndicator";

export interface RealtimeApplicationListProps {
  enabled?: boolean;
}

function transportToMode(t: "websocket" | "polling" | "idle", enabled: boolean): LiveActivityMode {
  if (!enabled) return "disabled";
  if (t === "websocket") return "websocket";
  return "polling";
}

export function RealtimeApplicationList({ enabled = isRealtimeFeatureEnabled() }: RealtimeApplicationListProps) {
  const { applications, loading, error, transport, refetch } = useRealTimeUpdates({ enabled });

  const mode = transportToMode(transport, enabled);

  return (
    <GlassCard className="p-4 sm:p-6" data-testid="realtime-application-list">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Bandeja en vivo</h2>
          <p className="text-sm text-gray-400">Actualización por WebSocket con respaldo por polling.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LiveActivityIndicator mode={mode} />
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
            data-testid="realtime-refresh"
          >
            Refrescar
          </button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-amber-300">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">Cargando cola…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-gray-500">Sin solicitudes en cola (mock o cola vacía).</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm text-gray-200">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Solicitud</th>
                <th className="py-2 pr-3">Solicitante</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2">Banda</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => (
                <tr key={row.application_id} className="border-b border-white/5" data-testid={`rt-row-${row.application_id}`}>
                  <td className="py-2 pr-3 font-mono text-xs">{row.application_id.slice(0, 8)}…</td>
                  <td className="py-2 pr-3">{row.applicant_name ?? "—"}</td>
                  <td className="py-2 pr-3">{row.score ?? "—"}</td>
                  <td className="py-2 pr-3">{row.state}</td>
                  <td className="py-2">{row.approval_band ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
