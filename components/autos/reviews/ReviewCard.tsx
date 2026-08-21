"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Minus, Bot, ShieldAlert, MessageSquare } from "lucide-react";
import type { Review } from "@/types/reviews-ai";

interface Props {
  review: Review;
  onRespond: (reviewId: string, useAi: boolean) => Promise<void>;
  onFlag: (reviewId: string) => Promise<void>;
  showActions?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

const SENTIMENT_ICON = {
  positive: { Icon: ThumbsUp, color: "text-emerald-400" },
  neutral: { Icon: Minus, color: "text-gray-400" },
  negative: { Icon: ThumbsDown, color: "text-red-400" },
};

const SOURCE_LABEL: Record<string, string> = {
  portal: "Portal",
  whatsapp: "WhatsApp",
  google: "Google",
  facebook: "Facebook",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
}

export default function ReviewCard({ review, onRespond, onFlag, showActions = true }: Props) {
  const [acting, setActing] = useState<"ai" | "manual" | "flag" | null>(null);

  const sentimentMeta = review.sentiment ? SENTIMENT_ICON[review.sentiment] : null;

  async function handleRespond(useAi: boolean) {
    setActing(useAi ? "ai" : "manual");
    try {
      await onRespond(review.id, useAi);
    } finally {
      setActing(null);
    }
  }

  async function handleFlag() {
    setActing("flag");
    try {
      await onFlag(review.id);
    } finally {
      setActing(null);
    }
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border backdrop-blur-xl p-5 space-y-3 ${
      review.fraud_flagged ? "border-red-500/30" : "border-white/10"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{review.buyer_name}</p>
            {review.verified_purchase && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                Verificado
              </span>
            )}
            {review.fraud_flagged && (
              <span className="text-xs text-red-400 flex items-center gap-0.5">
                <ShieldAlert className="w-3 h-3" /> Sospechoso
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} />
            {sentimentMeta && <sentimentMeta.Icon className={`w-3.5 h-3.5 ${sentimentMeta.color}`} />}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">{timeAgo(review.created_at)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{SOURCE_LABEL[review.source] ?? review.source}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-200 leading-relaxed">{review.content}</p>

      {/* Existing response */}
      {review.response && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-1 mb-1">
            {review.response.is_ai_generated && <Bot className="w-3.5 h-3.5 text-violet-400" />}
            <span className="text-xs text-gray-400">
              Respuesta del concesionario{review.response.is_ai_generated ? " (AI)" : ""}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{review.response.content}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && !review.response && review.status !== "hidden" && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleRespond(true)}
            disabled={acting !== null}
            className="flex items-center gap-1.5 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
          >
            <Bot className="w-3.5 h-3.5" />
            {acting === "ai" ? "Generando..." : "Responder con AI"}
          </button>
          <button
            onClick={() => handleRespond(false)}
            disabled={acting !== null}
            className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Responder manual
          </button>
          {!review.fraud_flagged && (
            <button
              onClick={handleFlag}
              disabled={acting !== null}
              className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {acting === "flag" ? "Marcando..." : "Reportar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
