"use client";

import { Shield, ShieldCheck, Award } from "lucide-react";
import type { ReputationBadge } from "@/types/reviews-ai";

const BADGE_META: Record<ReputationBadge, { label: string; color: string; bg: string; border: string }> = {
  bronze: {
    label: "Bronce",
    color: "text-amber-700",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
  },
  silver: {
    label: "Plata",
    color: "text-gray-300",
    bg: "bg-gray-500/10",
    border: "border-gray-400/30",
  },
  gold: {
    label: "Oro",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
  },
  platinum: {
    label: "Platino",
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/30",
  },
};

const BADGE_ORDER: ReputationBadge[] = ["bronze", "silver", "gold", "platinum"];

function BadgeIcon({ badge, active }: { badge: ReputationBadge; active: boolean }) {
  const meta = BADGE_META[badge];
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "opacity-100" : "opacity-30"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${meta.bg} ${meta.border}`}>
        {badge === "platinum" ? (
          <Award className={`w-5 h-5 ${meta.color}`} />
        ) : badge === "gold" ? (
          <ShieldCheck className={`w-5 h-5 ${meta.color}`} />
        ) : (
          <Shield className={`w-5 h-5 ${meta.color}`} />
        )}
      </div>
      <span className={`text-xs ${active ? meta.color : "text-gray-600"}`}>{meta.label}</span>
    </div>
  );
}

interface Props {
  current: ReputationBadge;
  avgRating: number;
  totalReviews: number;
  reviewsNeeded: number;
  ratingNeeded: number;
}

export default function BadgeProgress({ current, avgRating, totalReviews, reviewsNeeded, ratingNeeded }: Props) {
  const currentIdx = BADGE_ORDER.indexOf(current);
  const isPlatinum = current === "platinum";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl p-6 space-y-5">
      <h2 className="text-lg font-semibold text-white">Insignia de Reputación</h2>

      {/* Badge ladder */}
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute inset-x-0 top-5 h-px bg-white/10 z-0" />
        <div
          className="absolute left-0 top-5 h-px bg-gradient-to-r from-amber-700 via-amber-400 to-cyan-400 z-0 transition-all"
          style={{ width: `${(currentIdx / (BADGE_ORDER.length - 1)) * 100}%` }}
        />

        {BADGE_ORDER.map((badge, i) => (
          <div key={badge} className="relative z-10">
            <BadgeIcon badge={badge} active={i <= currentIdx} />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <p className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Calificación promedio</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalReviews}</p>
          <p className="text-xs text-gray-400 mt-0.5">Reseñas publicadas</p>
        </div>
      </div>

      {/* Next badge requirements */}
      {!isPlatinum && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-gray-400 mb-2">Para alcanzar el siguiente nivel:</p>
          <ul className="space-y-1">
            {reviewsNeeded > 0 && (
              <li className="text-xs text-gray-300">
                + <span className="text-white font-medium">{reviewsNeeded}</span> reseñas más
              </li>
            )}
            {ratingNeeded > 0 && (
              <li className="text-xs text-gray-300">
                Calificación promedio de <span className="text-white font-medium">{(avgRating + ratingNeeded).toFixed(1)}</span>+
              </li>
            )}
          </ul>
        </div>
      )}

      {isPlatinum && (
        <p className="text-center text-sm text-cyan-300">
          ¡Felicidades! Has alcanzado el nivel Platino.
        </p>
      )}
    </div>
  );
}
