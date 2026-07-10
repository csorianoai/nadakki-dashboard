"use client";

import { useEffect, useState } from "react";
import { fetchPlans, fetchUsage } from "../api/tenantAdmin";
import { useCockpit } from "../context";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelFrame, PanelSkeleton } from "../components/PanelFrame";

export function SubscriptionsPanel() {
  const { isPlatformSuperadmin } = useCockpit();
  const [plans, setPlans] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [usage, setUsage] = useState<Array<{ tenant_id: string; metric: string; used: number; limit: number; data_source?: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPlatformSuperadmin) return;
    void Promise.all([fetchPlans(), fetchUsage()]).then(([p, u]) => {
      setPlans(p);
      setUsage(u.rows);
      setIsDemo(u.isDemo);
      setLoading(false);
    });
  }, [isPlatformSuperadmin]);

  if (!isPlatformSuperadmin) {
    return (
      <PanelFrame title="Suscripciones">
        <p className="text-sm text-[var(--ch-text-3)]">Sección disponible solo para platform_superadmin.</p>
      </PanelFrame>
    );
  }

  return (
    <div className="space-y-4">
      <PanelFrame title="Planes">
        {loading ? <PanelSkeleton /> : (
          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="ch-card p-3 text-sm">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-[var(--ch-text-3)]">{p.description ?? p.id}</p>
              </div>
            ))}
          </div>
        )}
      </PanelFrame>
      <PanelFrame title="Consumo por tenant" badge={isDemo ? <DemoPanelBadge /> : undefined}>
        {loading ? <PanelSkeleton /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--ch-text-3)] border-b">
                <th className="py-2 text-left">Tenant</th>
                <th className="py-2 text-left">Métrica</th>
                <th className="py-2 text-left">Uso</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((row, i) => (
                <tr key={`${row.tenant_id}-${row.metric}-${i}`} className="border-b border-[var(--ch-line)]">
                  <td className="py-2">{row.tenant_id}</td>
                  <td className="py-2">
                    {row.metric}
                    {row.data_source === "none" ? <DemoPanelBadge /> : null}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[120px] rounded bg-[var(--ch-surface-3)]">
                        <div
                          className="h-2 rounded bg-[var(--ch-persona)]"
                          style={{ width: `${row.limit ? Math.min(100, (row.used / row.limit) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-xs">{row.used}/{row.limit}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelFrame>
    </div>
  );
}
