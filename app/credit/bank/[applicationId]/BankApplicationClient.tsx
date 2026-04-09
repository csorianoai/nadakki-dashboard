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
import { formatPercentDecimal } from "@/lib/credit-format";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Expediente — Banco
          </h1>
          <p className="font-mono text-xs text-slate-500 mt-1">{applicationId}</p>
        </div>
        <Link
          href="/credit/bank"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Cola
        </Link>
      </div>

      <ValidationBanner error={error} />
      {pdfErr && <ValidationBanner error={pdfErr} />}

      {loading && !dossier ? (
        <div className="animate-pulse h-64 rounded-xl bg-white/5" />
      ) : dossier ? (
        <>
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

          {ai && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-2">
              <h2 className="text-slate-200 font-medium">Decisión IA</h2>
              <p className="text-slate-400">
                Resultado:{" "}
                <span className="text-slate-100 font-medium">
                  {String(ai.decision ?? ai.recommendation ?? "—")}
                </span>
              </p>
              {ai.score != null && (
                <p className="text-slate-400">
                  Score:{" "}
                  <span className="tabular-nums text-slate-100">
                    {Number(ai.score).toFixed(1)}
                  </span>
                </p>
              )}
              {ai.confidence != null && (
                <p className="text-slate-400">
                  Confianza:{" "}
                  {formatPercentDecimal(Number(ai.confidence))}
                </p>
              )}
            </div>
          )}

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
      ) : null}
    </div>
  );
}
