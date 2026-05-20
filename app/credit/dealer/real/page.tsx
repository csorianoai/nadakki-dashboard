"use client";

import { useCallback, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import NavigationBar from "@/components/ui/NavigationBar";
import { LiveActivityIndicator, type LiveActivityMode } from "@/components/realtime/LiveActivityIndicator";
import { useWebSocket } from "@/hooks/useWebSocket";
import { parseRealtimeMessage } from "@/lib/realtime/event-handlers";
import { isRealtimeFeatureEnabled } from "@/lib/realtime/websocket-client";

type OfferRow = { id: string; bank: string; apr: string; at: string };

export default function DealerRealtimeOffersPage() {
  const realtime = isRealtimeFeatureEnabled();
  const [appId, setAppId] = useState("e2e-app-local");
  const [offers, setOffers] = useState<OfferRow[]>([]);

  const { state: wsState, reconnect } = useWebSocket({
    enabled: realtime,
    onMessage: (raw) => {
      const ev = parseRealtimeMessage(raw);
      if (ev?.kind === "offer.received") {
        const o = ev.offer as Record<string, unknown>;
        setOffers((prev) => [
          {
            id: `of-${Date.now()}`,
            bank: String(o.bank_name ?? o.bank ?? "Banco"),
            apr: String(o.apr ?? o.rate ?? "—"),
            at: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      }
      if (ev?.kind === "aggregation.updated") {
        void ev;
      }
    },
  });

  const activityMode: LiveActivityMode = !realtime
    ? "disabled"
    : wsState === "connected"
      ? "websocket"
      : "polling";

  const simulateLocalOffer = useCallback(() => {
    setOffers((prev) => [
      {
        id: `sim-${Date.now()}`,
        bank: "Simulado — Banco Demo",
        apr: (8 + Math.random() * 4).toFixed(2) + "%",
        at: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
  }, []);

  return (
    <div className="ndk-page ndk-fade-in mx-auto max-w-3xl px-4 py-6 sm:px-6" data-testid="dealer-real-page">
      <NavigationBar backHref="/credit/dealer/new" />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-300/90">Dealer — laboratorio</p>
          <h1 className="text-2xl font-bold text-white">Ofertas en tiempo real</h1>
          <p className="mt-1 text-sm text-gray-400">
            Seguimiento de ofertas agregadas; compatible con WebSocket y modo degradado sin socket.
          </p>
        </div>
        <LiveActivityIndicator mode={activityMode} />
      </header>

      {!realtime && (
        <GlassCard className="mb-6 border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-100">
            Sin bandera de tiempo real — solo verás la simulación local. Configura{" "}
            <code className="text-amber-50">NEXT_PUBLIC_FEATURE_REALTIME_UPDATES</code>.
          </p>
        </GlassCard>
      )}

      <GlassCard className="mb-6 p-4 sm:p-6">
        <label className="block text-sm text-gray-400">
          ID de solicitud (sintético)
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            data-testid="dealer-real-app-id"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={simulateLocalOffer}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            data-testid="dealer-simulate-offer"
          >
            Simular oferta local
          </button>
          <button
            type="button"
            onClick={() => reconnect()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
            data-testid="dealer-reconnect-ws"
          >
            Reconectar WebSocket
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ofertas recibidas</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay ofertas — usa la simulación o espera eventos del backend.</p>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200"
                data-testid="dealer-offer-row"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-white">{o.bank}</span>
                  <span className="text-xs text-gray-500">{o.at}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">APR / Tasa: {o.apr}</div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
