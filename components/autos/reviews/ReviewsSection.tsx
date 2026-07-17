"use client";

import { useState } from "react";
import { Star, Filter } from "lucide-react";
import type { Review, ReviewSentiment } from "@/types/reviews-ai";
import ReviewCard from "./ReviewCard";

interface Props {
  reviews: Review[];
  loading?: boolean;
  onRespond: (reviewId: string, useAi: boolean) => Promise<void>;
  onFlag: (reviewId: string) => Promise<void>;
}

type SentimentFilter = "all" | ReviewSentiment;

export default function ReviewsSection({ reviews, loading, onRespond, onFlag }: Props) {
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const filtered = reviews.filter((r) => {
    if (sentimentFilter !== "all" && r.sentiment !== sentimentFilter) return false;
    if (ratingFilter !== null && r.rating !== ratingFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />

        {/* Sentiment filters */}
        {(["all", "positive", "neutral", "negative"] as SentimentFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSentimentFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
              sentimentFilter === s
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
            }`}
          >
            {s === "all" ? "Todos" : s === "positive" ? "Positivos" : s === "neutral" ? "Neutros" : "Negativos"}
          </button>
        ))}

        {/* Star rating filter */}
        <div className="flex gap-1 ml-auto">
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => setRatingFilter(ratingFilter === n ? null : n)}
              className={`flex items-center gap-0.5 text-xs px-2 py-1.5 rounded-lg border transition-all ${
                ratingFilter === n
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <Star className="w-3 h-3" />
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500">{filtered.length} reseñas</p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm rounded-2xl bg-white/5 border border-white/10">
          No hay reseñas con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRespond={onRespond}
              onFlag={onFlag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
