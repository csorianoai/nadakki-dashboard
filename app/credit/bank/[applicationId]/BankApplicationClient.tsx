"use client";

import {
  DossierCard,
  ExplanationCard,
  OfferComparisonTable,
  OfferForm,
  SimilarCasesPanel,
  ValidationBanner,
} from "@/components/credit";
import {
  CreditApiError,
  createOffer,
  downloadApplicationSummaryPdf,
  downloadExecutiveMemoPdf,
  downloadOfferPdf,
  getApplicationFull,
  getExplanation,
  getSimilarCases,
  listOffers,
  type OfferCreatePayload,
} from "@/lib/credit-api";
import { formatPercentDecimal } from "@/lib/credit-format";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function BankApplicationClient({
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
  const [similar, setSimilar] = useState<Record<string, unknown>[] | null>(
    null
  );
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerMsg, setOfferMsg] = useState<string | null>(null);
  const [pdfErr, setPdfErr] = useState<string | null>(null);
  const [pdfDocBusy, setPdfDocBusy] = useState<"summary" | "memo" | null>(
    null
  );
  const [pdfOfferBusyId, setPdfOfferBusyId] = useState<string | null>(null);

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

  async function handlePdfSummary() {
    setPdfErr(null);
    setPdfDocBusy("summary");
    try {
      await downloadApplicationSummaryPdf(tenantId, applicationId);
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPdfDocBusy(null);
    }
  }

  async function handlePdfMemo() {
    setPdfErr(null);
    setPdfDocBusy("memo");
    try {
      await downloadExecutiveMemoPdf(tenantId, applicationId);
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPdfDocBusy(null);
    }
  }

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

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <span className="text-xs font-medium text-slate-500 mr-1">
              PDF:
            </span>
            <button
              type="button"
              disabled={pdfDocBusy !== null}
              onClick={handlePdfSummary}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
            >
              {pdfDocBusy === "summary"
                ? "Generando…"
                : "Resumen solicitud"}
            </button>
            <button
              type="button"
              disabled={pdfDocBusy !== null}
              onClick={handlePdfMemo}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
            >
              {pdfDocBusy === "memo" ? "Generando…" : "Memo ejecutivo"}
            </button>
          </div>

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
        </>
      ) : null}
    </div>
  );
}
