"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Cpu, AlertCircle } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import {
  getDocumentHistory,
  processAllDocuments,
  type DocumentHistoryEntry,
} from "@/lib/api/document-intelligence";
import DocumentIntelligenceCard from "./DocumentIntelligenceCard";
import DocumentHistoryDrawer from "./DocumentHistoryDrawer";
import FaceMatchCard from "./FaceMatchCard";
import FraudSignalsCard from "./FraudSignalsCard";
import DocumentReviewPanel from "./DocumentReviewPanel";

export type DocumentIntelligenceVariant = "dealer" | "bank";

export interface DocumentIntelligenceWorkspaceProps {
  variant: DocumentIntelligenceVariant;
  tenantId: string;
  applicationId: string;
}

export default function DocumentIntelligenceWorkspace({
  variant,
  tenantId,
  applicationId,
}: DocumentIntelligenceWorkspaceProps) {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [processAllBusy, setProcessAllBusy] = useState(false);
  const [processAllErr, setProcessAllErr] = useState<string | null>(null);
  const [reviewDocId, setReviewDocId] = useState<string>("");

  const bump = useCallback(() => {
    setRefreshSignal((n) => n + 1);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!tenantId.trim()) {
      setHistoryLoading(false);
      setDocumentIds([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const h = await getDocumentHistory(applicationId, tenantId);
      const latestByDoc = new Map<string, DocumentHistoryEntry>();
      for (const v of h.versions) {
        const prev = latestByDoc.get(v.document_id);
        if (!prev || v.version > prev.version) latestByDoc.set(v.document_id, v);
      }
      const ids = [...latestByDoc.entries()]
        .filter(([, entry]) => entry.status !== "deleted")
        .map(([id]) => id);
      setDocumentIds([...new Set(ids)]);
    } catch (e) {
      setDocumentIds([]);
      setHistoryError(
        e instanceof CreditApiError
          ? e.message
          : "Historial no disponible (puedes usar Procesar todos)."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [tenantId, applicationId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshSignal]);

  useEffect(() => {
    if (!documentIds.length) {
      setReviewDocId("");
      return;
    }
    if (!reviewDocId || !documentIds.includes(reviewDocId)) {
      setReviewDocId(documentIds[0]!);
    }
  }, [documentIds, reviewDocId]);

  const reviewOptions = useMemo(() => documentIds, [documentIds]);

  async function onProcessAll() {
    if (!tenantId.trim()) return;
    setProcessAllBusy(true);
    setProcessAllErr(null);
    try {
      await processAllDocuments(applicationId, tenantId);
      bump();
    } catch (e) {
      setProcessAllErr(
        e instanceof CreditApiError ? e.message : "Error al procesar documentos."
      );
    } finally {
      setProcessAllBusy(false);
    }
  }

  const showBankOnly = variant === "bank";

  return (
    <section className="rounded-xl border border-sky-500/20 bg-slate-900/40 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100 m-0">
              Document Intelligence
            </h2>
            <p className="text-[11px] text-slate-500 m-0">
              {variant === "dealer"
                ? "Extracción y procesamiento (sin aprobación)."
                : "Fraude, face match y revisión de documentos."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DocumentHistoryDrawer
            tenantId={tenantId}
            applicationId={applicationId}
            refreshSignal={refreshSignal}
          />
          <button
            type="button"
            disabled={processAllBusy || !tenantId.trim()}
            onClick={() => void onProcessAll()}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
          >
            {processAllBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            Procesar todos
          </button>
        </div>
      </div>

      {(historyError || processAllErr) && (
        <p className="text-xs text-amber-200/90 m-0 flex items-start gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {processAllErr ?? historyError}
        </p>
      )}

      {showBankOnly ? (
        <div className="grid md:grid-cols-2 gap-4">
          <FraudSignalsCard
            tenantId={tenantId}
            applicationId={applicationId}
            refreshSignal={refreshSignal}
          />
          <FaceMatchCard
            tenantId={tenantId}
            applicationId={applicationId}
            refreshSignal={refreshSignal}
          />
        </div>
      ) : null}

      {historyLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sincronizando documentos del expediente…
        </div>
      ) : documentIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
          No hay documentos activos en historial. Usa <strong>Procesar todos</strong>{" "}
          cuando el backend tenga adjuntos, o sube documentos desde el flujo del dealer.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {documentIds.map((did, idx) => (
            <DocumentIntelligenceCard
              key={did}
              tenantId={tenantId}
              applicationId={applicationId}
              documentId={did}
              documentLabel={`Documento ${idx + 1}`}
              refreshSignal={refreshSignal}
            />
          ))}
        </div>
      )}

      {showBankOnly && reviewOptions.length > 0 ? (
        <div className="space-y-2">
          {reviewOptions.length > 1 ? (
            <label className="block text-[10px] uppercase text-slate-500">
              Documento a revisar
              <select
                value={reviewDocId || reviewOptions[0]!}
                onChange={(e) => setReviewDocId(e.target.value)}
                className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-slate-200"
              >
                {reviewOptions.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <DocumentReviewPanel
            tenantId={tenantId}
            applicationId={applicationId}
            documentId={reviewDocId || reviewOptions[0]!}
            onSaved={bump}
          />
        </div>
      ) : null}
    </section>
  );
}
