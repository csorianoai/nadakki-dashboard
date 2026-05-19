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
  AppHealthScore,
  RiskBasedUI,
} from "@/components/credit";
import { BestOfferHero } from "@/components/credit/commercial/BestOfferHero";
import { ExecutiveSummaryCard } from "@/components/credit/commercial/ExecutiveSummaryCard";
import { NarrativeCard } from "@/components/credit/commercial/NarrativeCard";
import { PdfActionsPanel } from "@/components/credit/commercial/PdfActionsPanel";
import { DocumentCompletenessCard } from "@/components/credit/documents/DocumentCompletenessCard";
import { DocumentList } from "@/components/credit/documents/DocumentList";
import { DocumentUploader } from "@/components/credit/documents/DocumentUploader";
import DocumentIntelligenceWorkspace from "@/components/document-intelligence/DocumentIntelligenceWorkspace";
import {
  CreditApiError,
  downloadOfferPdf,
  getApplicationFull,
  getDocumentCompleteness,
  getExplanation,
  getNarrative,
  getOffersRank,
  getOptimization,
  getSimilarCases,
  listDocuments,
  listOffers,
  type CreditDocument,
  type NarrativeResult,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import type { ApplicationHealthData } from "@/lib/credit/app-health-score";
import {
  applicationDataFromDealerSources,
  calculateApplicationHealthScore,
} from "@/lib/credit/app-health-score";
import { isAppHealthScoreFeatureEnabled } from "@/lib/env/feature-app-health-score";
import { isRiskBasedUxFeatureEnabled } from "@/lib/env/feature-risk-based-ux";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DecisionSnapshotCard } from "@/components/credit/forge";
import { FileStack, Gauge, Sparkles } from "lucide-react";

export function DealerApplicationClient({
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
  const [pdfErr, setPdfErr] = useState<string | null>(null);
  const [pdfOfferBusyId, setPdfOfferBusyId] = useState<string | null>(null);

  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const [docs, setDocs] = useState<CreditDocument[]>([]);
  const [completeness, setCompleteness] = useState<Awaited<
    ReturnType<typeof getDocumentCompleteness>
  > | null>(null);

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

    setLoadingNarrative(true);
    void getNarrative(tenantId, applicationId)
      .then(setNarrative)
      .catch(() => setNarrative(null))
      .finally(() => setLoadingNarrative(false));

    void listDocuments(tenantId, applicationId)
      .then(setDocs)
      .catch(() => setDocs([]));

    void getDocumentCompleteness(tenantId, applicationId)
      .then(setCompleteness)
      .catch(() => setCompleteness(null));
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

  const [healthOverrides, setHealthOverrides] = useState<
    Partial<ApplicationHealthData>
  >({});
  useEffect(() => setHealthOverrides({}), [applicationId]);

  const healthBase = useMemo(
    (): ApplicationHealthData =>
      applicationDataFromDealerSources({
        applicant: dossier?.applicant,
        vehicle: dossier?.vehicle,
        aiScore: score,
        ltvFraction: ltv,
        completeness,
      }),
    [
      dossier?.applicant,
      dossier?.vehicle,
      score,
      ltv,
      completeness?.missing_categories,
      completeness?.completeness_pct,
    ]
  );

  const mergedHealthData = useMemo((): ApplicationHealthData => {
    const out = { ...healthBase };
    for (const [k, val] of Object.entries(healthOverrides) as [
      keyof ApplicationHealthData,
      number | undefined
    ][]) {
      if (val !== undefined && !Number.isNaN(val)) (out[k] as number) = val;
      else delete out[k];
    }
    return out;
  }, [healthBase, healthOverrides]);

  const readinessScore = useMemo(
    () => calculateApplicationHealthScore(mergedHealthData),
    [mergedHealthData]
  );

  const patchHealthOverrides = useCallback((patch: Partial<ApplicationHealthData>) => {
    setHealthOverrides((prev) => {
      const base = { ...prev };
      for (const [key, raw] of Object.entries(patch) as [
        keyof ApplicationHealthData,
        number | undefined
      ][]) {
        if (raw === undefined || (typeof raw === "number" && Number.isNaN(raw))) {
          delete base[key];
        } else base[key] = raw;
      }
      return base;
    });
  }, []);

  const bestId =
    rank?.best_overall?.offer_id != null
      ? String(rank.best_overall.offer_id)
      : null;

  const tableOffers =
    rank?.ranked_eligible && rank.ranked_eligible.length > 0
      ? rank.ranked_eligible
      : dossier?.offers;

  const pdfOfferId = useMemo(() => {
    if (bestId) return bestId;
    const o = dossier?.offers?.[0] as Record<string, unknown> | undefined;
    if (!o) return undefined;
    const id = o.offer_id ?? o.id;
    return id != null ? String(id) : undefined;
  }, [bestId, dossier?.offers]);

  const nextAction = useMemo(() => {
    if (!dossier) return null;
    const st = (dossier.state ?? "").toUpperCase();
    if (!st || st === "DRAFT") {
      return {
        title: "Siguiente mejor acción",
        body: "Complete solicitante, vehículo y documentación; luego procese para obtener score IA y narrativa.",
      };
    }
    if (st === "COMPLETED") {
      return {
        title: "Paquete bank-ready",
        body: "Descargue PDFs y comparta el expediente con la mesa en /credit/bank para revisión institucional.",
      };
    }
    return {
      title: "Seguimiento",
      body: "Mantenga documentos al día y use Vista cliente para transparencia con el solicitante.",
    };
  }, [dossier]);

  const confidenceLabel = useMemo(() => {
    if (!ai || ai.confidence == null) return null;
    const c = Number(ai.confidence);
    if (Number.isNaN(c)) return null;
    return `${(c * 100).toFixed(1)}%`;
  }, [ai]);

  async function handlePdfOffer(offerId: string) {
    setPdfErr(null);
    setPdfOfferBusyId(offerId);
    try {
      await downloadOfferPdf(tenantId, applicationId, offerId);
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPdfOfferBusyId(null);
    }
  }

  const refreshDocs = useCallback(() => {
    void listDocuments(tenantId, applicationId)
      .then(setDocs)
      .catch(() => setDocs([]));
    void getDocumentCompleteness(tenantId, applicationId)
      .then(setCompleteness)
      .catch(() => setCompleteness(null));
  }, [tenantId, applicationId]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-950 p-6 shadow-2xl md:flex md:items-center md:justify-between md:p-8">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Dealer · expediente vivo
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Command view</h1>
          <p className="mt-2 max-w-xl font-mono text-xs text-slate-500 break-all">{applicationId}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:justify-end">
          <Link
            href="/credit/dealer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            ← Listado
          </Link>
          <Link
            href={`/credit/status/${encodeURIComponent(applicationId)}`}
            className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/15"
          >
            Vista cliente
          </Link>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Actualizar
          </button>
        </div>
      </div>

      <ValidationBanner error={error} />
      {pdfErr && <ValidationBanner error={pdfErr} />}

      {tenantId && isAppHealthScoreFeatureEnabled() ? (
        <AppHealthScore
          applicationId={applicationId}
          tenantId={tenantId}
          applicationData={mergedHealthData}
          onApplicationDataPatch={patchHealthOverrides}
        />
      ) : null}

      {tenantId && isRiskBasedUxFeatureEnabled() ? (
        <RiskBasedUI applicationId={applicationId} tenantId={tenantId} score={readinessScore} />
      ) : null}

      {loading && !dossier ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : dossier ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DecisionSnapshotCard
                title="AI decision snapshot"
                decision={
                  ai?.decision != null
                    ? String(ai.decision)
                    : ai?.recommendation != null
                      ? String(ai.recommendation)
                      : null
                }
                score={score}
                confidenceLabel={confidenceLabel}
                footnote="La recomendación IA no sustituye dictamen legal ni decisión bancaria formal."
              />
            </div>
            {nextAction ? (
              <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 ring-1 ring-emerald-500/10">
                <div>
                  <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                    <Gauge className="h-3.5 w-3.5" aria-hidden />
                    {nextAction.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{nextAction.body}</p>
                </div>
                <Link
                  href="/credit/bank"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  <FileStack className="h-4 w-4" aria-hidden />
                  Ir a consola banco
                </Link>
              </div>
            ) : null}
          </div>

          <DossierCard
            applicant={dossier.applicant}
            vehicle={dossier.vehicle}
            ltv={ltv}
          />

          <ExecutiveSummaryCard
            explanation={dossier.ai_decision}
            optimize={optimization}
            ranking={rank}
          />

          <NarrativeCard
            narrative={narrative}
            role="dealer"
            loading={loadingNarrative}
          />

          <PdfActionsPanel
            applicationId={applicationId}
            offerId={pdfOfferId}
          />

          <DocumentCompletenessCard completeness={completeness} />
          <DocumentUploader
            applicationId={applicationId}
            onUploadSuccess={() => refreshDocs()}
          />
          <DocumentList documents={docs} loading={false} />

          <BestOfferHero ranking={rank} />

          <div className="grid lg:grid-cols-3 gap-4">
            <ScoreGauge score={score} />
            <div className="lg:col-span-2">
              <DealTimeline state={dossier.state} events={dossier.events} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ExplanationCard data={explanation} error={explErr} />
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
              onDownloadOfferPdf={handlePdfOffer}
              pdfLoadingOfferId={pdfOfferBusyId}
            />
          </div>

          <SimilarCasesPanel cases={similar} />

          <DocumentIntelligenceWorkspace
            variant="dealer"
            tenantId={tenantId}
            applicationId={applicationId}
          />
        </>
      ) : !loading && error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center text-sm text-rose-100">
          No se pudo cargar el expediente. Revise conexión al API y permisos del tenant, luego pulse Actualizar.
        </div>
      ) : null}
    </div>
  );
}
