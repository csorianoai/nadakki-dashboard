// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
"use client";

import GlassCard from "@/components/ui/GlassCard";
import NavigationBar from "@/components/ui/NavigationBar";
import { RealtimeApplicationList } from "@/components/realtime/RealtimeApplicationList";
import { RealTimeNotifications } from "@/components/realtime/RealTimeNotifications";
import { isRealtimeFeatureEnabled } from "@/lib/realtime/websocket-client";

export default function BankWorkflowRealPage() {
  const realtime = isRealtimeFeatureEnabled();

  return (
    <div className="ndk-page ndk-fade-in mx-auto max-w-5xl px-4 py-6 sm:px-6" data-testid="workflow-real-page">
      <NavigationBar backHref="/credit-hub/bank/applications" />

      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-cyan-300/90">Banco — laboratorio</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Flujo con tiempo real</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          Cola de solicitudes actualizada por WebSocket; si el socket cae, el cliente hace polling automático de la API.
        </p>
      </header>

      {!realtime && (
        <GlassCard className="mb-6 border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-100">
            Activa <code className="text-amber-50">NEXT_PUBLIC_FEATURE_REALTIME_UPDATES=true</code> y configura{" "}
            <code className="text-amber-50">NEXT_PUBLIC_WS_URL</code> para habilitar el canal en vivo.
          </p>
        </GlassCard>
      )}

      <RealTimeNotifications enabled={realtime} />
      <RealtimeApplicationList enabled={realtime} />
    </div>
  );
}
