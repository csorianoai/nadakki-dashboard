"use client";

import { useState } from "react";
import { AlertTriangle, Car, Loader2, Search } from "lucide-react";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { useTenant } from "@/contexts/TenantContext";
import { getVinAnomalies, type VinAnomaliesResult } from "../_lib/ops-actions-api";

function AnomalyRow({ anomaly, index }: { anomaly: Record<string, unknown>; index: number }) {
  const type = typeof anomaly.type === "string" ? anomaly.type : "no disponible";
  const severity = typeof anomaly.severity === "string" ? anomaly.severity : "no disponible";
  const detail = typeof anomaly.detail === "string" ? anomaly.detail : null;

  return (
    <li className="rounded-lg border border-forgeGray-100 p-3 text-sm" data-testid={`vin-anomaly-${index}`}>
      <div style={{ fontWeight: 600 }}>
        {type} · {severity}
      </div>
      {detail ? <p style={{ color: "var(--ch-text-3)", marginTop: 4 }}>{detail}</p> : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-forgeGray-500">Payload completo</summary>
        <pre className="mt-1 max-h-40 overflow-auto rounded bg-forgeSurface-sunken p-2 text-xs">
          {JSON.stringify(anomaly, null, 2)}
        </pre>
      </details>
    </li>
  );
}

function VehicleAnomaliesContent() {
  const { tenantId } = useTenant();
  const tid = tenantId?.trim() ?? "";

  const [vinInput, setVinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VinAnomaliesResult | null>(null);

  const consult = async () => {
    const vin = vinInput.trim().toUpperCase();
    if (!vin) {
      setError("Ingrese un VIN");
      return;
    }
    if (!tid) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getVinAnomalies(tid, vin);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar anomalías");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6" data-testid="vehicle-anomalies-page">
      <header>
        <div className="flex items-center gap-2 text-amber-700">
          <Car className="h-5 w-5" aria-hidden />
          <span className="ch-eyebrow">Credit Hub · Banco</span>
        </div>
        <h1 className="ch-serif mt-2" style={{ fontSize: 24, marginBottom: 4 }}>
          Historial de vehículo
        </h1>
        <p style={{ fontSize: 14, color: "var(--ch-text-3)" }}>
          Consulta anomalías detectadas en el historial de un VIN.
        </p>
      </header>

      <section className="ch-card p-4">
        <label className="block text-sm font-medium text-forgeGray-700" htmlFor="vin-input">
          VIN
          <input
            id="vin-input"
            type="text"
            className="mt-2 w-full rounded border border-forgeGray-200 px-3 py-2 font-mono text-sm uppercase tracking-wide"
            placeholder="Ej. 1HGBH41JXMN109186"
            value={vinInput}
            onChange={(e) => setVinInput(e.target.value)}
            data-testid="vin-input"
          />
        </label>
        <button
          type="button"
          className="ch-btn ch-btn-secondary mt-4 inline-flex items-center gap-2"
          disabled={loading || !tid}
          data-testid="consult-vin-btn"
          onClick={() => void consult()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          Consultar
        </button>
      </section>

      {error ? (
        <div className="ch-card flex items-start gap-2 p-4 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="ch-card p-4" data-testid="vin-anomalies-result">
          <h2 className="ch-serif" style={{ fontSize: 16, margin: 0 }}>
            Resultado
          </h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-forgeGray-500">vin</dt>
              <dd className="font-mono">{result.vin ?? vinInput.trim().toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-forgeGray-500">anomaly_count</dt>
              <dd style={{ fontWeight: 600 }}>
                {result.anomaly_count != null ? String(result.anomaly_count) : "no disponible"}
              </dd>
            </div>
          </dl>

          {(result.anomalies ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-forgeGray-500">Sin anomalías registradas para este VIN.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(result.anomalies ?? []).map((a, i) => (
                <AnomalyRow key={`${String(a.type ?? "row")}-${i}`} anomaly={a} index={i} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function VehicleAnomaliesPage() {
  return (
    <CreditTenantGate>
      <VehicleAnomaliesContent />
    </CreditTenantGate>
  );
}
