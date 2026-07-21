"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { MarketingCampaign } from "@/lib/marketing-api";
import {
  campaignDisplayName,
  campaignDisplayStatus,
  campaignRowId,
} from "@/lib/marketing-api";

type CampaignCardProps = {
  campaign: MarketingCampaign;
  onExecute?: (id: string) => void;
  executingId?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  draft: "bg-gray-500/20 text-gray-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-purple-500/20 text-purple-400",
};

export function CampaignCard({ campaign, onExecute, executingId }: CampaignCardProps) {
  const id = campaignRowId(campaign);
  const name = campaignDisplayName(campaign);
  const status = campaignDisplayStatus(campaign).toLowerCase();
  const statusClass = STATUS_STYLES[status] ?? "bg-white/10 text-gray-300";
  const channel = String(campaign.channel ?? campaign.platform ?? "—");
  const objective = String(campaign.objective ?? campaign.marketing_objective ?? "—");

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-orange-500/40 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
            <Megaphone className="w-5 h-5 text-orange-400" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/marketing/campaigns/${encodeURIComponent(id)}`}
              className="font-semibold text-white hover:text-orange-300 truncate block"
            >
              {name}
            </Link>
            <p className="text-xs text-gray-500 mt-1 m-0">
              {channel} · {objective}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${statusClass}`}>
          {status}
        </span>
      </div>
      {onExecute && id ? (
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            disabled={executingId === id}
            onClick={() => onExecute(id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500/90 hover:bg-orange-500 text-white disabled:opacity-50"
          >
            {executingId === id ? "Ejecutando…" : "Ejecutar"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
