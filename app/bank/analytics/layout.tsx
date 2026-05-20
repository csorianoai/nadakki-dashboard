"use client";

import { type ReactNode, useEffect, useState } from "react";
import { canAccessBankAnalytics, isBankAnalyticsEnabled } from "@/lib/bank/analytics-api";

export default function BankAnalyticsRouteLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="mx-auto min-h-[40vh] max-w-5xl animate-pulse rounded-2xl border border-white/12 bg-slate-950/40 p-6"
        aria-busy="true"
        data-testid="bank-analytics-layout-hydrating"
      >
        <span className="sr-only">Comprobando rol bancario antes de renderizar analítica supervisada</span>
      </div>
    );
  }

  if (!isBankAnalyticsEnabled()) {
    return (
      <div
        className="mx-auto max-w-3xl px-4 py-14 text-sm text-gray-300"
        data-testid="bank-analytics-flag-off"
      >
        <h1 className="text-xl font-semibold text-white">Analítica bancaria</h1>
        <p className="mt-4 text-gray-400">
          Esta experiencia se activa en compilación con{" "}
          <span className="font-mono text-fuchsia-100">NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=true</span>.
        </p>
      </div>
    );
  }

  if (!canAccessBankAnalytics()) {
    return (
      <div
        className="mx-auto max-w-3xl px-4 py-14 text-center text-sm text-amber-200"
        role="alert"
        data-testid="bank-analytics-access-denied"
      >
        <p className="font-semibold">Sólo analistas bancarios pueden abrir este panel.</p>
        <p className="mt-3 text-xs text-gray-400">
          Requiere perfil BANK_ANALYST o BANK_ADMIN transmitido vía X-Role (almacenamiento `nadakki_role` o overrides de
          desarrollo).
        </p>
      </div>
    );
  }

  return <div className="min-h-0 bg-[#040314] text-white">{children}</div>;
}
