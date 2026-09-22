"use client";

import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";

export default function DealerConexionesPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Conexiones</h1>
      </header>
      <DealerSponsorshipBanner />
    </main>
  );
}
