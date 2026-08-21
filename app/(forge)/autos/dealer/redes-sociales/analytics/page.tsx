"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Eye, MousePointerClick, Users, Lightbulb } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { getSocialAnalytics } from "@/lib/autos-portal/social-api";
import type { SocialAnalytics, SocialPlatform } from "@/types/social-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
  tiktok: "bg-teal-500",
  youtube: "bg-red-500",
};

function StatCard({ Icon, label, value, sub }: { Icon: React.FC<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SocialAnalyticsPage() {
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;
  const [analytics, setAnalytics] = useState<SocialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSocialAnalytics(DEMO_DEALER_ID, tid)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tid]);

  const s = analytics?.summary;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analíticas Sociales</h1>
          <p className="text-sm text-gray-400">Métricas de rendimiento por plataforma</p>
        </div>
        {analytics?.is_mock && (
          <span className="ml-auto text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            MODO DEMO
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : s ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard Icon={Eye} label="Impresiones" value={s.total_impressions.toLocaleString("es-DO")} />
            <StatCard Icon={Users} label="Alcance" value={s.total_reach.toLocaleString("es-DO")} />
            <StatCard Icon={TrendingUp} label="Engagement" value={s.total_engagements.toLocaleString("es-DO")} />
            <StatCard Icon={MousePointerClick} label="Clics" value={s.total_clicks.toLocaleString("es-DO")} />
            <StatCard Icon={Lightbulb} label="Leads generados" value={String(s.total_leads_generated)} sub="de redes sociales" />
          </div>

          {/* By platform */}
          <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Por plataforma</h2>
            <div className="space-y-4">
              {analytics?.by_platform.map((p) => {
                const maxImpressions = Math.max(...(analytics.by_platform.map((x) => x.impressions) ?? [1]));
                const pct = maxImpressions > 0 ? (p.impressions / maxImpressions) * 100 : 0;
                return (
                  <div key={p.platform}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-white">{p.platform}</span>
                      <span className="text-gray-400">{p.impressions.toLocaleString("es-DO")} impresiones</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${PLATFORM_COLOR[p.platform as SocialPlatform] ?? "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                      <span>{p.clicks} clics</span>
                      <span>{p.engagements} engagement</span>
                      <span className="text-emerald-500">{p.leads} leads</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">No se pudieron cargar las analíticas.</div>
      )}
    </div>
  );
}
