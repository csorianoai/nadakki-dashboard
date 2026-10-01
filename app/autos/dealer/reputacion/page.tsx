"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MessageSquare, TrendingUp, Shield } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { getReputationAnalytics } from "@/lib/autos-portal/reviews-api";
import BadgeProgress from "@/components/autos/reviews/BadgeProgress";
import type { ReputationAnalytics } from "@/types/reviews-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

function StatCard({ Icon, label, value, color = "text-white" }: { Icon: React.FC<{ className?: string }>; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function ReputacionPage() {
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;

  const [analytics, setAnalytics] = useState<ReputationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReputationAnalytics(DEMO_DEALER_ID, tid)
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tid]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reputación AI</h1>
            <p className="text-sm text-gray-400">Gestión inteligente de reseñas</p>
          </div>
        </div>
        <Link
          href="/autos/dealer/reputacion/reviews"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          Ver reseñas
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard Icon={Star} label="Calificación promedio" value={analytics.avg_rating.toFixed(1)} color="text-amber-400" />
            <StatCard Icon={MessageSquare} label="Reseñas publicadas" value={String(analytics.total_published)} />
            <StatCard Icon={TrendingUp} label="Tasa de respuesta" value={`${analytics.response_rate_pct}%`} color="text-emerald-400" />
            <StatCard Icon={Shield} label="Marcadas sospechosas" value={String(analytics.fraud_flagged)} color={analytics.fraud_flagged > 0 ? "text-red-400" : "text-white"} />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Badge progress */}
            <BadgeProgress
              current={analytics.reputation_badge}
              avgRating={analytics.avg_rating}
              totalReviews={analytics.total_published}
              reviewsNeeded={analytics.badge_progress.reviews_needed}
              ratingNeeded={analytics.badge_progress.rating_needed}
            />

            {/* Sentiment breakdown */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Sentimiento de reseñas</h2>
              <div className="space-y-4">
                {[
                  { label: "Positivas", count: analytics.sentiment_breakdown.positive, color: "bg-emerald-500", pct: analytics.sentiment_breakdown.positive_pct },
                  { label: "Neutrales", count: analytics.sentiment_breakdown.neutral, color: "bg-gray-500", pct: analytics.total_published > 0 ? (analytics.sentiment_breakdown.neutral / analytics.total_published * 100) : 0 },
                  { label: "Negativas", count: analytics.sentiment_breakdown.negative, color: "bg-red-500", pct: analytics.total_published > 0 ? (analytics.sentiment_breakdown.negative / analytics.total_published * 100) : 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-gray-400">{item.count} ({item.pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {analytics.pending_moderation > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    {analytics.pending_moderation} reseña(s) pendiente(s) de moderación
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">No se pudieron cargar las analíticas de reputación.</div>
      )}
    </div>
  );
}
