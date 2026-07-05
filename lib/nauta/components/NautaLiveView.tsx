"use client";

/**
 * Live view placeholder — Fase C-live (BLOCKED_CONTROLLED).
 *
 * CSP / sandbox (Browser-use Cloud / Browserbase):
 * - No global CSP in next.config today; when adding: frame-src for vendor domains.
 * - Use signed short-lived live_url from backend; sandbox="allow-scripts allow-same-origin".
 * - Provider may deny embed via X-Frame-Options / frame-ancestors.
 * - iframe NOT connected until provider decision.
 */
export function NautaLiveView({ liveUrl: _liveUrl }: { liveUrl?: string | null }) {
  return (
    <section
      data-testid="nauta-live-view"
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
    >
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-medium text-zinc-100">Vista en vivo</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Browser remoto del empleado digital</p>
      </div>
      <div className="relative flex min-h-[220px] items-center justify-center bg-zinc-950/80 p-6">
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-zinc-300">Ejecución en vivo — disponible próximamente</p>
          <p className="mt-2 text-xs text-zinc-600">
            Contenedor iframe reservado para live_url (Browser-use Cloud / Browserbase). Proveedor pendiente.
          </p>
        </div>
      </div>
    </section>
  );
}
