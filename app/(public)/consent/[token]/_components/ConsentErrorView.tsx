"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

/**
 * Cuarto estado: no pudimos preguntarle al servidor.
 *
 * Distinto de ConsentInvalidView a proposito. Aquel afirma que el token no
 * sirve, y esa afirmacion solo la puede hacer el SERVIDOR. Cuando el fetch ni
 * siquiera sale -CSP, red, DNS-, el cliente no sabe si el token es valido: no
 * puede decir que no lo es.
 */
export function ConsentErrorView() {
  const t = useTranslations();

  return (
    <main className="container mx-auto max-w-md px-4 py-12 text-center" data-testid="consent-error">
      <div className="mb-6 flex justify-center" aria-hidden>
        <svg className="h-16 w-16 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h.01M8.5 16.4a5 5 0 017 0M5.5 13.1a9 9 0 0113 0M2.5 9.8a13 13 0 0119 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white">{t.consent.public.transport_error}</h1>
      <p className="text-slate-300">{t.consent.public.transport_error_help}</p>
    </main>
  );
}
