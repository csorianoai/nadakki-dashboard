"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function ConsentLoadingView() {
  const t = useTranslations();

  return (
    <main className="container mx-auto max-w-md px-4 py-12 text-center" role="status" aria-busy="true" aria-live="polite">
      <div className="animate-pulse space-y-4">
        <div className="h-12 rounded-lg bg-slate-800" />
        <div className="h-32 rounded-lg bg-slate-800" />
        <div className="h-32 rounded-lg bg-slate-800" />
      </div>
      <p className="mt-6 text-sm text-slate-500">{t.consent.public.loading}</p>
    </main>
  );
}
