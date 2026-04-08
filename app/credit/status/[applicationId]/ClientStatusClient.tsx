"use client";

import {
  DealTimeline,
  ExplanationCard,
  OfferComparisonTable,
  ScoreGauge,
  ValidationBanner,
} from "@/components/credit";
import {
  CreditApiError,
  getApplicationFull,
  getExplanation,
  getOffersRank,
} from "@/lib/credit-api";
import { formatDOP, simulateMonthlyPayment } from "@/lib/credit-format";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Informative-only term slider; does not change bank offers. */
export function ClientStatusClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const { tenantId: ctxTenantId } = useTenant();
  const tenantId = (ctxTenantId ?? "").trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dossier, setDossier] = useState<Awaited<
    ReturnType<typeof getApplicationFull>
  > | null>(null);
  const [explanation, setExplanation] = useState<Awaited<
    ReturnType<typeof getExplanation>
  > | null>(null);
  const [explErr, setExplErr] = useState<string | null>(null);
  const [rank, setRank] = useState<Awaited<
    ReturnType<typeof getOffersRank>
  > | null>(null);
  const [termMonths, setTermMonths] = useState(48);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const full = await getApplicationFull(tenantId, applicationId);
      setDossier(full);
      const rk = await getOffersRank(tenantId, applicationId);
      setRank(rk);
      if (full.ai_decision) {
        try {
          setExplanation(await getExplanation(tenantId, applicationId));
        } catch (e) {
          setExplanation(null);
          setExplErr(
            e instanceof CreditApiError ? e.message : "Sin explicación"
          );
        }
      } else {
        setExplanation(null);
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

  const ai = dossier?.ai_decision as Record<string, unknown> | undefined;
  const score = ai?.score != null ? Number(ai.score) : null;

  const simPrincipal = useMemo(() => {
    const v = dossier?.vehicle as Record<string, unknown> | undefined;
    if (v?.loan_amount_requested != null) {
      return Number(v.loan_amount_requested);
    }
    return null;
  }, [dossier?.vehicle]);

  const tableOffers = useMemo(() => {
    if (rank?.ranked_eligible && rank.ranked_eligible.length > 0) {
      return rank.ranked_eligible;
    }
    return dossier?.offers;
  }, [rank, dossier?.offers]);

  const bestId =
    rank?.best_overall?.offer_id != null
      ? String(rank.best_overall.offer_id)
      : null;

  /** Simulation uses APR from primera oferta listada — sin ofertas, sin tasa inventada */
  const refApr = useMemo(() => {
    const first = tableOffers?.[0];
    if (first && first.apr_annual != null) {
      return Number(first.apr_annual);
    }
    return null;
  }, [tableOffers]);

  const simulatedPayment =
    simPrincipal != null &&
    simPrincipal > 0 &&
    refApr != null &&
    !Number.isNaN(refApr)
      ? simulateMonthlyPayment(simPrincipal, refApr, termMonths)
      : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Estado de su solicitud
        </h1>
        <p className="font-mono text-xs text-slate-500 mt-1">{applicationId}</p>
        <p className="text-xs text-slate-500 mt-2">
          Enlace para seguimiento del cliente. Requiere la misma institución
          seleccionada en el portal.
        </p>
        <Link
          href="/credit/dealer"
          className="text-xs text-violet-400 hover:underline mt-2 inline-block"
        >
          Portal dealer (interno)
        </Link>
      </div>

      <ValidationBanner error={error} />

      {loading && !dossier ? (
        <div className="animate-pulse h-64 rounded-xl bg-white/5" />
      ) : dossier ? (
        <>
          {!dossier.ai_decision && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Solicitud pendiente de procesamiento o sin decisión disponible.
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-500 uppercase">Estado actual</p>
              <p className="text-lg font-medium text-slate-100 mt-1">
                {dossier.state ?? "—"}
              </p>
            </div>
            <ScoreGauge score={score} />
          </div>

          <DealTimeline state={dossier.state} events={dossier.events} />

          <ExplanationCard data={explanation} error={explErr} />

          <div>
            <h2 className="text-sm font-medium text-slate-300 mb-2">
              Comparador de ofertas
            </h2>
            <OfferComparisonTable
              offers={tableOffers}
              bestOfferId={bestId}
              emptyMessage="Sin ofertas aún"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-200">
              Simulación de plazo (solo referencia)
            </h2>
            <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1.5">
              Esta simulación es informativa y no modifica las ofertas reales
              registradas por las entidades.
            </p>
            <label className="block text-xs text-slate-500">
              Plazo: {termMonths} meses
            </label>
            <input
              type="range"
              min={12}
              max={84}
              step={12}
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            {simulatedPayment != null && refApr != null ? (
              <p className="text-sm text-slate-300">
                Cuota estimada (referencia, tasa de la oferta mostrada{" "}
                {(refApr * 100).toFixed(2)}% nominal anual):{" "}
                <strong>{formatDOP(simulatedPayment)}</strong>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {simPrincipal == null || simPrincipal <= 0
                  ? "Se requiere monto solicitado en el expediente."
                  : "Se requiere al menos una oferta con tasa para simular."}
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
