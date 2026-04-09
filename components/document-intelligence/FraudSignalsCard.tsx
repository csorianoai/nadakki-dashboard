"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, RefreshCw } from "lucide-react";
import { CreditApiError } from "@/lib/credit-api";
import {
  getFraudSignals,
  riskLevelIsHigh,
  type FraudSignalsPayload,
} from "@/lib/api/document-intelligence";

export interface FraudSignalsCardProps {
  tenantId: string;
  applicationId: string;
  refreshSignal?: number;
}

export default function FraudSignalsCard({
  tenantId,
  applicationId,
  refreshSignal = 0,
}: FraudSignalsCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FraudSignalsPayload | null>(null);

  const load = useCallback(async () => {
    if (!tenantId.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await getFraudSignals(applicationId, tenantId);
      setData(r);
    } catch (e) {
      setData(null);
      setError(
        e instanceof CreditApiError ? e.message : "Señales de fraude no disponibles."
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, applicationId]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  const high = riskLevelIsHigh(data?.risk_level ?? null);

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        high
          ? "border-red-500/40 bg-red-500/10"
          : "border-orange-500/20 bg-orange-500/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${high ? "text-red-300" : "text-orange-300"}`} />
          <h3 className="text-sm font-medium text-slate-100 m-0">Fraude</h3>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {high ? (
        <p className="text-xs font-medium text-red-200 m-0">Riesgo alto</p>
      ) : null}

      {error ? (
        <p className="text-xs text-amber-200/90 m-0">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase text-slate-500 m-0">Fraud score</p>
              <p className="text-slate-100 font-semibold tabular-nums m-0 mt-1">
                {data?.fraud_score != null && Number.isFinite(data.fraud_score)
                  ? data.fraud_score.toFixed(3)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-500 m-0">Riesgo</p>
              <p className="text-slate-100 font-medium m-0 mt-1 uppercase text-xs">
                {data?.risk_level ?? "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase text-slate-500 m-0 mb-1">Flags</p>
            {data?.flags && data.flags.length > 0 ? (
              <ul className="m-0 pl-4 text-xs text-slate-300 space-y-0.5 list-disc">
                {data.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 m-0">Sin flags</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
