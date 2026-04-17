"use client";

import { useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

function detailFromUnknown(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const detail = (json as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

export default function MarketingBookingPage() {
  const { tenantId } = useTenant();
  const [message, setMessage] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const sendToAgent = async () => {
    if (!tenantId?.trim()) {
      setError("Selecciona un tenant.");
      return;
    }
    if (!message.trim()) {
      setError("Escribe un mensaje del cliente.");
      return;
    }
    if (!fromNumber.trim()) {
      setError("Indica el número de origen (from_number).");
      return;
    }
    if (!contactName.trim()) {
      setError("Indica el nombre de contacto.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/booking/intent", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId.trim(),
        },
        body: JSON.stringify({
          text: message.trim(),
          from_number: fromNumber.trim(),
          contact_name: contactName.trim(),
        }),
      });
      const json = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) throw new Error(detailFromUnknown(json, `HTTP ${res.status}`));
      setResult(json && typeof json === "object" ? (json as Record<string, unknown>) : {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const customerReply =
    result != null
      ? String(
          (result as { customer_reply?: unknown }).customer_reply ??
            (result as { reply?: unknown }).reply ??
            (result as { assistant_message?: unknown }).assistant_message ??
            "—"
        )
      : "";
  const intentDetected =
    result != null
      ? String(
          (result as { intent_detected?: unknown }).intent_detected ??
            (result as { intent?: unknown }).intent ??
            (result as { intent_label?: unknown }).intent_label ??
            "—"
        )
      : "";

  const rawEntities =
    result != null
      ? (result as { entities?: unknown }).entities ??
        (result as { slots?: unknown }).slots ??
        (result as { extracted_entities?: unknown }).extracted_entities
      : null;
  const entities =
    rawEntities && typeof rawEntities === "object" && rawEntities !== null && !Array.isArray(rawEntities)
      ? (rawEntities as Record<string, unknown>)
      : {};

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing" />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Booking Agent</h1>
        <p className="text-gray-400 mt-1">Agente de reservas automático.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Entrada</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-500">Mensaje del cliente</span>
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Número de origen (from_number)</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                placeholder="+5215512345678"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Nombre de contacto</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre del cliente"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Intención / canal (referencia)</span>
              <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {["walk_in", "online", "whatsapp"].map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0d1117]">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="text-sm text-red-400 m-0">{error}</p>}
            <button type="button" onClick={() => void sendToAgent()} disabled={loading} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
              Enviar al agente
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Respuesta</h2>
          {!result && !loading && (
            <p className="text-sm text-gray-400 m-0">Sin respuesta todavía. Envía un mensaje para ver resultado.</p>
          )}
          {loading && (
            <p className="text-sm text-gray-400 m-0 inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Procesando conversación...
            </p>
          )}
          {result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">customer_reply</p>
                <p className="text-sm text-white mt-1 m-0 whitespace-pre-wrap">{customerReply}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">intent_detected</p>
                <p className="text-sm text-white mt-1 m-0">{intentDetected}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0 mb-2">entities</p>
                {Object.keys(entities).length === 0 ? (
                  <p className="text-sm text-gray-400 m-0">—</p>
                ) : (
                  <ul className="text-sm text-gray-200 space-y-1 m-0">
                    {Object.entries(entities).map(([k, v]) => (
                      <li key={k}>
                        {k}: {v == null ? "—" : String(v)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                <summary className="cursor-pointer text-xs text-gray-500">JSON completo (backend)</summary>
                <pre className="mt-2 text-xs text-gray-300 overflow-auto max-h-56 whitespace-pre-wrap break-words m-0">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
