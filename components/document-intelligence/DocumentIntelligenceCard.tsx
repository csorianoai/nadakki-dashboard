"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import {
  extractionStatusLabel,
  getExtractedFields,
  processDocument,
  type ExtractionStatus,
  type ExtractedFieldsPayload,
} from "@/lib/api/document-intelligence";

export interface DocumentIntelligenceCardProps {
  tenantId: string;
  applicationId: string;
  documentId: string;
  documentLabel?: string;
  refreshSignal?: number;
}

function formatConfidence(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 0 && v <= 1) return `${Math.round(v * 1000) / 10}%`;
  if (v > 1 && v <= 100) return `${Math.round(v * 10) / 10}%`;
  return `${v}`;
}

function statusTone(status: ExtractionStatus): string {
  switch (status) {
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "needs_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    case "processing":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function DocumentIntelligenceCard({
  tenantId,
  applicationId,
  documentId,
  documentLabel,
  refreshSignal = 0,
}: DocumentIntelligenceCardProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtractedFieldsPayload | null>(null);

  const load = useCallback(async () => {
    if (!tenantId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getExtractedFields(applicationId, documentId, tenantId);
      setData(r);
    } catch (e) {
      setData(null);
      setError(
        e instanceof CreditApiError ? e.message : "No se pudieron cargar los campos."
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, applicationId, documentId]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  async function onProcess() {
    if (!tenantId.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      await processDocument(applicationId, documentId, tenantId);
      await load();
    } catch (e) {
      setError(
        e instanceof CreditApiError ? e.message : "Error al procesar el documento."
      );
    } finally {
      setProcessing(false);
    }
  }

  const status = data?.extraction_status ?? "pending";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${statusTone(status)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 opacity-80" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium m-0 truncate">
              {documentLabel ?? "Documento"}
            </h3>
            <p className="text-[11px] font-mono opacity-70 truncate m-0 mt-0.5">
              {documentId}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
          title="Actualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error ? (
        <p className="text-xs m-0 flex items-start gap-1 text-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando extracción…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="opacity-60">Estado</span>
              <p className="font-medium m-0 mt-0.5">
                {extractionStatusLabel(status)}
              </p>
            </div>
            <div>
              <span className="opacity-60">Confianza</span>
              <p className="font-medium m-0 mt-0.5 tabular-nums">
                {formatConfidence(data?.extraction_confidence)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-2 max-h-36 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wide opacity-50 m-0 mb-1">
              Campos extraídos
            </p>
            {data?.extracted_fields &&
            Object.keys(data.extracted_fields).length > 0 ? (
              <dl className="space-y-1 m-0">
                {Object.entries(data.extracted_fields).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[11px]">
                    <dt className="text-slate-400 shrink-0">{k}</dt>
                    <dd className="m-0 font-mono break-all">
                      {typeof v === "object"
                        ? JSON.stringify(v)
                        : String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs opacity-60 m-0">Sin campos aún</p>
            )}
          </div>

          {data?.error_message ? (
            <p className="text-xs text-red-200/90 m-0">{data.error_message}</p>
          ) : null}
        </>
      )}

      <button
        type="button"
        disabled={processing || !tenantId.trim()}
        onClick={() => void onProcess()}
        className="w-full py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {processing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : null}
        Procesar
      </button>
    </div>
  );
}
