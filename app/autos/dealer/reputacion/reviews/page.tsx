"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { listReviews, respondToReview, flagReview } from "@/lib/autos-portal/reviews-api";
import ReviewsSection from "@/components/autos/reviews/ReviewsSection";
import type { Review } from "@/types/reviews-ai";

const DEMO_DEALER_ID = "d1111111-0000-4000-b000-000000000001";
const DEMO_TENANT_ID = "d0000001-0000-4000-a000-000000000001";

// Demo reviews for mock mode (backend returns empty before any reviews submitted)
const MOCK_REVIEWS: Review[] = [
  {
    id: "mock-review-001",
    buyer_name: "Carlos Méndez",
    rating: 5,
    content: "Excelente servicio, me ayudaron a encontrar el carro ideal. El proceso fue rápido y transparente.",
    sentiment: "positive",
    sentiment_score: 0.92,
    fraud_flagged: false,
    status: "published",
    source: "portal",
    verified_purchase: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    response: undefined,
  },
  {
    id: "mock-review-002",
    buyer_name: "Ana García",
    rating: 4,
    content: "Buena experiencia en general. El financiamiento fue sencillo de gestionar.",
    sentiment: "positive",
    sentiment_score: 0.71,
    fraud_flagged: false,
    status: "published",
    source: "whatsapp",
    verified_purchase: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    response: {
      content: "¡Gracias Ana! Fue un placer servirle.",
      is_ai_generated: true,
      published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "mock-review-003",
    buyer_name: "Roberto Jiménez",
    rating: 2,
    content: "La espera fue bastante larga. Esperaba mejor atención post-venta.",
    sentiment: "negative",
    sentiment_score: -0.45,
    fraud_flagged: false,
    status: "published",
    source: "google",
    verified_purchase: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    response: undefined,
  },
];

export default function ReviewsPage() {
  const { tenantId } = useTenant();
  const tid = tenantId ?? DEMO_TENANT_ID;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    listReviews(DEMO_DEALER_ID, tid)
      .then((r) => {
        // If no real reviews yet, show demo data
        setReviews(r.reviews.length > 0 ? r.reviews : MOCK_REVIEWS);
        setIsMock(r.reviews.length === 0);
      })
      .catch(() => {
        setReviews(MOCK_REVIEWS);
      })
      .finally(() => setLoading(false));
  }, [tid]);

  async function handleRespond(reviewId: string, useAi: boolean) {
    if (isMock) {
      // Simulate response in mock mode
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                response: {
                  content: useAi
                    ? "¡Muchas gracias por su reseña! Es un placer servirle y esperamos verle pronto."
                    : "Gracias por compartir su experiencia.",
                  is_ai_generated: useAi,
                  published_at: new Date().toISOString(),
                },
              }
            : r,
        ),
      );
      return;
    }

    await respondToReview(reviewId, {
      dealer_id: DEMO_DEALER_ID,
      tenant_id: tid,
      use_ai: useAi,
    });
    // Refresh
    const updated = await listReviews(DEMO_DEALER_ID, tid);
    setReviews(updated.reviews);
  }

  async function handleFlag(reviewId: string) {
    if (isMock) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, fraud_flagged: true, status: "hidden" as const } : r)),
      );
      return;
    }

    await flagReview(reviewId, { dealer_id: DEMO_DEALER_ID, tenant_id: tid });
    const updated = await listReviews(DEMO_DEALER_ID, tid);
    setReviews(updated.reviews);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/autos/dealer/reputacion" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reseñas</h1>
            <p className="text-sm text-gray-400">Gestión y respuestas AI</p>
          </div>
        </div>
        {isMock && (
          <span className="ml-auto text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            MODO DEMO
          </span>
        )}
      </div>

      <ReviewsSection
        reviews={reviews}
        loading={loading}
        onRespond={handleRespond}
        onFlag={handleFlag}
      />
    </div>
  );
}
