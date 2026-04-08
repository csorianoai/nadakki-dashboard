"use client";

import {
  DealTimeline,
  ExplanationCard,
  OfferComparisonTable,
  OptimizationPanel,
  ScoreGauge,
  SimilarCasesPanel,
  ValidationBanner,
  DossierCard,
} from "@/components/credit";
import {
  CreditApiError,
  getApplicationFull,
  getExplanation,
  getOffersRank,
  getOptimization,
  getSimilarCases,
  listOffers,
} from "@/lib/credit-api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function DealerApplicationClient({
  tenantId,
  applicationId,
}: {
  tenantId: string;
  applicationId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dossier, setDossier] = useState<Awaited<
    ReturnType<typeof getApplicationFull>
  > | null>(null);
  const [explanation, setExplanation] = useState<Awaited<
    ReturnType<typeof getExplanation>
  > | null>(null);
  const [explErr, setExplErr] = useState<string | null>(null);
  const [optimization, setOptimization] = useState<Awaited<
    ReturnType<typeof getOptimization>
  > | null>(null);
  const [optErr, setOptErr] = useState<string | null>(null);
  const [rank, setRank] = useState<Awaited<
    ReturnType<typeof getOffersRank>
  > | null>(null);
  const [similar, setSimilar] = useState<Record<string, unknown>[] | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExplErr(null);
    setOptErr(null);
    try {
      const full = await getApplicationFull(tenantId, applicationId);
      const [offRes, rankRes, simRes] = await Promise.all([
        listOffers(tenantId, applicationId),
        getOffersRank(tenantId, applicationId),
        getSimilarCases(tenantId, applicationId),
      ]);
      const mergedOffers =
        full.offers && full.offers.length > 0
          ? full.offers
          : offRes.offers ?? [];
      setDossier({ ...full, offers: mergedOffers });
      setRank(rankRes);
      setSimilar(simRes.similar_cases ?? []);

      if (full.ai_decision) {
        try {
          setExplanation(await getExplanation(tenantId, applicationId));
        } catch (e) {
          setExplanation(null);
          setExplErr(
            e instanceof CreditApiError ? e.message : "Explicación no disponible"
          );
        }
      } else {
        setExplanation(null);
      }

      try {
        setOptimization(await getOptimization(tenantId, applicationId));
      } catch (e) {
        setOptimization(null);
        setOptErr(
          e instanceof CreditApiError
            ? e.message
            : "Optimización no disponible"
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [tenantId, applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const ai = dossier?.ai_decision as Record<string, unknown> | null | undefined;
  const score = ai?.score != null ? Number(ai.score) : null;

  const ltv = useMemo(() => {
    const v = dossier?.vehicle as Record<string, unknown> | undefined;
    const loan =
      v?.loan_amount_requested != null
        ? Number(v.loan_amount_requested)
        : null;
    const val = v?.vehicle_value != null ? Number(v.vehicle_value) : null;
    if (loan == null || val == null || val <= 0) return null;
    return loan / val;
  }, [dossier?.vehicle]);

  const bestId =
    rank?.best_overall?.offer_id != null
      ? String(rank.best_overall.offer_id)
      : null;

  const tableOffers =
    rank?.ranked_eligible && rank.ranked_eligible.length > 0
      ? rank.ranked_eligible
      : dossier?.offers;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Expediente dealer
          </h1>
          <p className="font-mono text-xs text-slate-500 mt-1">{applicationId}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href="/credit/dealer"
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            ← Listado
          </Link>
          <Link
            href={`/credit/status/${encodeURIComponent(applicationId)}`}
            className="text-sm text-sky-400 hover:underline"
          >
            Vista cliente
          </Link>
          <button
            type="button"
            onClick={load}
            className="text-sm rounded-lg border border-white/15 px-3 py-1 text-slate-300"
          >
            Actualizar
          </button>
        </div>
      </div>

      <ValidationBanner error={error} />

      {loading && !dossier ? (
        <div className="animate-pulse h-96 rounded-xl bg-white/5" />
      ) : dossier ? (
        <>
          <DossierCard
            applicant={dossier.applicant}
            vehicle={dossier.vehicle}
            ltv={ltv}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <ScoreGauge score={score} />
            <div className="lg:col-span-2">
              <DealTimeline state={dossier.state} events={dossier.events} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ExplanationCard
              data={explanation}
              error={explErr}
            />
            <OptimizationPanel data={optimization} error={optErr} />
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-300 mb-2">
              Ofertas y ranking
            </h2>
            <OfferComparisonTable
              offers={tableOffers}
              bestOfferId={bestId}
              emptyMessage="Sin ofertas aún"
            />
          </div>

          <SimilarCasesPanel cases={similar} />
        </>
      ) : null}
    </div>
  );
}
