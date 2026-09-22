"use client";

import { DealerCoreStatusHome } from "@/components/dealer/DealerCoreStatusHome";

export default function DealerCoreStatusPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Estado de cores</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Qué puedes operar ahora. READY solo si readiness declara usable y el batch lo permite.
        </p>
      </header>
      <DealerCoreStatusHome />
    </main>
  );
}
