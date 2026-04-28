"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function ConsentInvalidView() {
  const t = useTranslations();

  return (
    <main className="container mx-auto max-w-md px-4 py-12 text-center" data-testid="consent-invalid">
      <div className="mb-6 flex justify-center" aria-hidden>
        <svg className="h-16 w-16 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-white">{t.consent.public.invalid_link}</h1>
      <p className="text-slate-300">{t.consent.public.invalid_link_help}</p>
    </main>
  );
}
