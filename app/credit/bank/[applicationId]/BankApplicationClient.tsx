"use client";

import {
  DossierCard,
  ExplanationCard,
  OfferComparisonTable,
  OfferForm,
  SimilarCasesPanel,
  ValidationBanner,
} from "@/components/credit";
import { BestOfferHero } from "@/components/credit/commercial/BestOfferHero";
import { ExecutiveSummaryCard } from "@/components/credit/commercial/ExecutiveSummaryCard";
import { NarrativeCard } from "@/components/credit/commercial/NarrativeCard";
import { PdfActionsPanel } from "@/components/credit/commercial/PdfActionsPanel";
import { DocumentCompletenessCard } from "@/components/credit/documents/DocumentCompletenessCard";
import { DocumentList } from "@/components/credit/documents/DocumentList";
import DocumentIntelligenceWorkspace from "@/components/document-intelligence/DocumentIntelligenceWorkspace";
import {
  CreditApiError,
  createOffer,
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
  type OfferCreatePayload,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BankManualDecisionNotice, DecisionSnapshotCard } from "@/components/credit/forge";
import { Gavel, Sparkles } from "lucide-react";

export function BankApplicationClient({
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
  const [similar, setSimilar] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [optimization, setOptimization] = useState<Awaited<
    ReturnType<typeof getOptimization>
  > | null>(null);
  const [rank, setRank] = useState<Awaited<
    ReturnType<typeof getOffersRank>
  > | null>(null);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerMsg, setOfferMsg] = useState<string | null>(null);
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
    try {
      const full = await getApplicationFull(tenantId, applicationId);
      const offRes = await listOffers(tenantId, applicationId);
      const mergedOffers =
        full.offers && full.offers.length > 0
          ? full.offers
          : offRes.offers ?? [];
      setDossier({ ...full, offers: mergedOffers });
      const sim = await getSimilarCases(tenantId, applicationId);
      setSimilar(sim.similar_cases ?? []);
      try {
        const rankRes = await getOffersRank(tenantId, applicationId);
        setRank(rankRes);
      } catch {
        setRank(null);
      }
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
      try {
        setOptimization(await getOptimization(tenantId, applicationId));
      } catch {
        setOptimization(null);
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

  async function onOffer(data: OfferCreatePayload) {
    setOfferBusy(true);
    setOfferMsg(null);
    try {
      await createOffer(tenantId, applicationId, data);
      setOfferMsg("Oferta registrada correctamente");
      await load();
    } catch (e) {
      setOfferMsg(
        e instanceof CreditApiError ? e.message : "Error al registrar oferta"
      );
    } finally {
      setOfferBusy(false);
    }
  }

  const ai = dossier?.ai_decision as Record<string, unknown> | undefined;
  const score =
    ai && ai.score != null && !Number.isNaN(Number(ai.score)) ? Number(ai.score) : null;
  const confidenceLabel =
    ai && ai.confidence != null && !Number.isNaN(Number(ai.confidence))
      ? `${(Number(ai.confidence) * 100).toFixed(1)}%`
      : null;
  const loan =
    dossier?.vehicle &&
    typeof dossier.vehicle === "object" &&
    dossier.vehicle !== null &&
    "loan_amount_requested" in dossier.vehicle
      ? Number(
          (dossier.vehicle as Record<string, unknown>).loan_amount_requested
        )
      : null;
  const val =
    dossier?.vehicle &&
    typeof dossier.vehicle === "object" &&
    "vehicle_value" in (dossier.vehicle as object)
      ? Number((dossier.vehicle as Record<string, unknown>).vehicle_value)
      : null;
  const ltv =
    loan != null && val != null && val > 0 ? loan / val : null;

  const bestId =
    rank?.best_overall?.offer_id != null
      ? String(rank.best_overall.offer_id)
      : null;

  const pdfOfferId = useMemo(() => {
    if (bestId) return bestId;
    const o = dossier?.offers?.[0] as Record<string, unknown> | undefined;
    if (!o) return undefined;
    const id = o.offer_id ?? o.id;
    return id != null ? String(id) : undefined;
  }, [bestId, dossier?.offers]);

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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-900 p-6 shadow-2xl md:flex md:items-center md:justify-between md:p-8">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Credit decision dossier
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Expediente banco</h1>
          <p className="mt-2 max-w-xl font-mono text-xs text-slate-500 break-all">{applicationId}</p>
        </div>
        <Link
          href="/credit/bank"
          className="mt-4 inline-flex shrink-0 items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 md:mt-0"
        >
          ← Cola
        </Link>
      </div>

      <ValidationBanner error={error} />
      {pdfErr && <ValidationBanner error={pdfErr} />}

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
                title="Recomendación IA (soporte)"
                decision={
                  ai?.decision != null
                    ? String(ai.decision)
                    : ai?.recommendation != null
                      ? String(ai.recommendation)
                      : null
                }
                score={score}
                confidenceLabel={confidenceLabel}
                footnote="La decisión institucional formal se registra en el canal con panel de decisión (Forge Credit Hub), no sustituida por esta vista."
              />
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div>
                <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  <Gavel className="h-3.5 w-3.5" aria-hidden />
                  Ofertas & compliance
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Revise documentos, narrativa y PDFs. Emita ofertas cuando corresponda; todo queda auditado en el core.
                </p>
              </div>
            </div>
          </div>

          <BankManualDecisionNotice applicationId={applicationId} />

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
            role="bank"
            loading={loadingNarrative}
          />

          <PdfActionsPanel
            applicationId={applicationId}
            offerId={pdfOfferId}
          />

          <DocumentCompletenessCard completeness={completeness} />
          <DocumentList documents={docs} loading={false} />

          <BestOfferHero ranking={rank} />

          <ExplanationCard data={explanation} error={explErr} />

          <SimilarCasesPanel cases={similar} />

          <div>
            <h2 className="text-sm font-medium text-slate-300 mb-2">
              Ofertas registradas
            </h2>
            <OfferComparisonTable
              offers={dossier.offers}
              onDownloadOfferPdf={handlePdfOffer}
              pdfLoadingOfferId={pdfOfferBusyId}
              emptyMessage="Sin ofertas aún"
            />
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="text-sm font-medium text-emerald-200 mb-4">
              Emitir oferta
            </h2>
            <OfferForm onSubmit={onOffer} disabled={offerBusy} />
            {offerMsg && (
              <p className="mt-3 text-sm text-slate-400">{offerMsg}</p>
            )}
          </div>

          <DocumentIntelligenceWorkspace
            variant="bank"
            tenantId={tenantId}
            applicationId={applicationId}
          />
        </>
      ) : !loading && error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/25 p-8 text-center text-sm text-rose-100">
          No se pudo cargar el dossier. Verifique API, tenant y vuelva a intentar.
        </div>
      ) : null}
    </div>
  );
}
