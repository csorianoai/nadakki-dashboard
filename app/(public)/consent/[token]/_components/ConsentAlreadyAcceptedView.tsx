"use client";

import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function ConsentAlreadyAcceptedView() {
  const t = useTranslations();

  return (
    <main className="container mx-auto max-w-md px-4 py-12 text-center" data-testid="consent-already" role="status">
      <h1 className="mb-3 text-2xl font-bold text-white">{t.consent.public.already_accepted}</h1>
      <p className="text-slate-300">{t.consent.public.already_accepted_help}</p>
    </main>
  );
}
