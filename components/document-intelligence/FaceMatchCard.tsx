"use client";

import { useState } from "react";
import { Loader2, ScanFace, Play } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import { runFaceMatch, type FaceMatchResult } from "@/lib/api/document-intelligence";

export interface FaceMatchCardProps {
  tenantId: string;
  applicationId: string;
  /** Cuando el padre refetcha tras procesar documentos, puedes pasar una señal (opcional). */
  refreshSignal?: number;
}

export default function FaceMatchCard({
  tenantId,
  applicationId,
}: FaceMatchCardProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FaceMatchResult | null>(null);

  async function onRun() {
    if (!tenantId.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const r = await runFaceMatch(applicationId, tenantId);
      setData(r);
    } catch (e) {
      setError(
        e instanceof CreditApiError ? e.message : "Error al ejecutar face match."
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScanFace className="w-5 h-5 text-violet-300" />
        <h3 className="text-sm font-medium text-slate-100 m-0">Face match</h3>
      </div>

      {error ? (
        <p className="text-xs text-red-200/90 m-0">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase text-slate-500 m-0">Score</p>
          <p className="text-slate-100 font-semibold tabular-nums m-0 mt-1">
            {data?.score != null && Number.isFinite(data.score)
              ? data.score.toFixed(2)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-500 m-0">Estado</p>
          <p className="text-slate-100 font-medium m-0 mt-1 capitalize">
            {data?.status ?? "—"}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 m-0">
        Ejecuta la verificación biométrica contra el backend real (POST).
      </p>

      <button
        type="button"
        disabled={running || !tenantId.trim()}
        onClick={() => void onRun()}
        className="w-full py-2 rounded-lg text-xs font-medium bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-100 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {running ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        Ejecutar
      </button>
    </div>
  );
}
