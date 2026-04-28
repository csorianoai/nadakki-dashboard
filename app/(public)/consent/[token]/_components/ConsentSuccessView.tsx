"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

interface ConsentSuccessViewProps {
  institutionName: string;
  acceptedAt: string;
  auditHash: string;
}

export function ConsentSuccessView({ institutionName, acceptedAt, auditHash }: ConsentSuccessViewProps) {
  const t = useTranslations();

  return (
    <main
      className="container mx-auto max-w-md px-4 py-12 text-center"
      data-testid="consent-success"
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 flex justify-center" aria-hidden>
        <svg className="h-16 w-16 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white">{t.consent.public.success_title}</h1>
      <p className="mb-6 text-slate-300">{t.consent.public.success_message}</p>

      <div className="space-y-2 rounded-lg bg-slate-800/40 p-4 text-left text-sm">
        <p className="text-slate-400">{institutionName}</p>
        <p className="text-slate-300 tabular-nums">{new Date(acceptedAt).toLocaleString("es-DO")}</p>
        <p className="break-all text-xs text-slate-500">
          {t.consent.public.success_audit} <span className="font-mono text-slate-400">{auditHash}</span>
        </p>
      </div>

      <p className="mt-8 text-sm text-slate-500">{t.consent.public.success_close}</p>
    </main>
  );
}
