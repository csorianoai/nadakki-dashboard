"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Plus, TrendingUp } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { listCampaigns } from "@/lib/autos-portal/ads-api";
import AdPerformanceCard from "@/components/autos/ads/AdPerformanceCard";
import type { AdCampaign } from "@/types/ads-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

export default function AnunciosPage() {
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    listCampaigns(DEMO_DEALER_ID, tid)
      .then((r) => {
        setCampaigns(r.campaigns);
        setIsMock(r.is_mock);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tid]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Generador de Anuncios AI</h1>
            <p className="text-sm text-gray-400">Campañas publicitarias inteligentes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isMock && (
            <span className="text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              MODO DEMO
            </span>
          )}
          <Link
            href="/autos/dealer/anuncios/nuevo"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva campaña
          </Link>
        </div>
      </div>

      {/* Campaigns */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No hay campañas activas.</p>
          <Link
            href="/autos/dealer/anuncios/nuevo"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Crear primera campaña
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <AdPerformanceCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}
