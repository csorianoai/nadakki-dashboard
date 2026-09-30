"use client";

import { DealerCoreStatusHome } from "@/components/dealer/DealerCoreStatusHome";

export default function DealerCoreStatusPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Estado de módulos</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Qué puedes usar hoy y qué se habilita según avance de tu onboarding.
        </p>
      </header>
      <DealerCoreStatusHome />
    </main>
  );
}
