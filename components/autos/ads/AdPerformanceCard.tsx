"use client";

import { TrendingUp, MousePointerClick, Eye, Users, DollarSign } from "lucide-react";
import type { AdCampaign, CampaignStatus } from "@/types/ads-ai";

const STATUS_COLOR: Record<CampaignStatus, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  completed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: "Activa",
  paused: "Pausada",
  draft: "Borrador",
  completed: "Completada",
  cancelled: "Cancelada",
};

interface Props {
  campaign: AdCampaign;
}

function Stat({ Icon, label, value }: { Icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 border border-white/10 p-3 gap-1">
      <Icon className="w-4 h-4 text-gray-400" />
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

export default function AdPerformanceCard({ campaign }: Props) {
  const p = campaign.performance ?? {};
  const budget = campaign.daily_budget_rd
    ? `RD$ ${campaign.daily_budget_rd.toLocaleString("es-DO")}/día`
    : "—";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{campaign.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{campaign.objective} · {budget}</p>
        </div>
        <span
          className={`text-xs border rounded-full px-2 py-0.5 whitespace-nowrap ${STATUS_COLOR[campaign.status]}`}
        >
          {STATUS_LABEL[campaign.status]}
        </span>
      </div>

      {/* Platform pills */}
      <div className="flex gap-1 flex-wrap">
        {campaign.platforms.map((pl) => (
          <span key={pl} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full capitalize">
            {pl}
          </span>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <Stat Icon={Eye} label="Impresiones" value={p.impressions != null ? p.impressions.toLocaleString("es-DO") : "—"} />
        <Stat Icon={MousePointerClick} label="Clics" value={p.clicks != null ? p.clicks.toLocaleString("es-DO") : "—"} />
        <Stat Icon={Users} label="Leads" value={p.leads != null ? String(p.leads) : "—"} />
        <Stat Icon={DollarSign} label="CPL" value={p.cpl_rd != null ? `RD$ ${Math.round(p.cpl_rd).toLocaleString("es-DO")}` : "—"} />
      </div>

      {campaign.is_mock && (
        <p className="text-xs text-amber-500/60">Datos de demo — conecta campaña real para métricas reales.</p>
      )}
    </div>
  );
}
