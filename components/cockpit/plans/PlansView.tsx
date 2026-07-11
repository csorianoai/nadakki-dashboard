"use client";

import { useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchPlans, fetchUsage } from "@/lib/cockpit/api/tenantAdmin";
import { useCockpit } from "@/lib/cockpit/context";

export function PlansView() {
  const { isPlatformSuperadmin } = useCockpit();
  const [plans, setPlans] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [usage, setUsage] = useState<Array<{ tenant_id: string; metric: string; used: number; limit: number; data_source?: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!isPlatformSuperadmin) return;
    void Promise.all([fetchPlans(), fetchUsage()]).then(([p, u]) => {
      setPlans(p);
      setUsage(u.rows);
      setIsDemo(u.isDemo);
    });
  }, [isPlatformSuperadmin]);

  if (!isPlatformSuperadmin) {
    return <p className="text-cockpit-muted">Acceso restringido a platform_superadmin.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Suscripciones y Planes</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
            <p className="text-lg font-semibold">{p.name}</p>
            <p className="text-sm text-cockpit-muted">{p.description ?? p.id}</p>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-semibold">Consumo por tenant</h2>
          {isDemo ? <DataTruthBadge level="DEMO" /> : null}
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-cockpit-muted">
            <tr>
              <th className="py-2 text-left">Tenant</th>
              <th className="py-2 text-left">Métrica</th>
              <th className="py-2 text-left">Uso</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((row, i) => (
              <tr key={`${row.tenant_id}-${row.metric}-${i}`} className="border-t border-cockpit-border">
                <td className="py-2">{row.tenant_id}</td>
                <td className="py-2">{row.metric}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded bg-cockpit-border">
                      <div className="h-2 rounded bg-cockpit-accent" style={{ width: `${row.limit ? Math.min(100, (row.used / row.limit) * 100) : 0}%` }} />
                    </div>
                    <span className="font-mono text-xs tabular-nums">{row.used}/{row.limit}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
