"use client";

import { useState } from "react";
import {
  downloadApplicationSummaryPdf,
  downloadExecutiveMemoPdf,
  downloadOfferPdf,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";

export interface PdfActionsPanelProps {
  applicationId: string;
  offerId?: string;
}

export function PdfActionsPanel({
  applicationId,
  offerId,
}: PdfActionsPanelProps) {
  const { tenantId: ctx } = useTenant();
  const tenantId = (ctx ?? "").trim();
  const [loading, setLoading] = useState<
    null | "summary" | "memo" | "offer"
  >(null);
  const [errSummary, setErrSummary] = useState<string | null>(null);
  const [errMemo, setErrMemo] = useState<string | null>(null);
  const [errOffer, setErrOffer] = useState<string | null>(null);

  async function onSummary() {
    if (!tenantId) return;
    setErrSummary(null);
    setLoading("summary");
    try {
      await downloadApplicationSummaryPdf(tenantId, applicationId);
    } catch (e) {
      setErrSummary(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  async function onMemo() {
    if (!tenantId) return;
    setErrMemo(null);
    setLoading("memo");
    try {
      await downloadExecutiveMemoPdf(tenantId, applicationId);
    } catch (e) {
      setErrMemo(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  async function onOffer() {
    if (!tenantId || !offerId) return;
    setErrOffer(null);
    setLoading("offer");
    try {
      await downloadOfferPdf(tenantId, applicationId, offerId);
    } catch (e) {
      setErrOffer(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h3 className="text-sm font-medium text-slate-200 m-0">PDFs</h3>
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={loading !== null || !tenantId}
            onClick={() => void onSummary()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            {loading === "summary" ? "Generando…" : "Descargar resumen"}
          </button>
          {errSummary ? (
            <p className="text-[11px] text-red-400 m-0">{errSummary}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={loading !== null || !tenantId}
            onClick={() => void onMemo()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            {loading === "memo" ? "Generando…" : "Descargar memo ejecutivo"}
          </button>
          {errMemo ? (
            <p className="text-[11px] text-red-400 m-0">{errMemo}</p>
          ) : null}
        </div>
        {offerId ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={loading !== null || !tenantId}
              onClick={() => void onOffer()}
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20 disabled:opacity-40"
            >
              {loading === "offer" ? "Generando…" : "Descargar oferta PDF"}
            </button>
            {errOffer ? (
              <p className="text-[11px] text-red-400 m-0">{errOffer}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
