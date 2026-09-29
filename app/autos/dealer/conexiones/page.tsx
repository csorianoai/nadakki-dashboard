"use client";

import Link from "next/link";
import { DealerSponsorshipBanner } from "@/components/dealer/DealerSponsorshipBanner";

export default function DealerConexionesPage() {
  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Conexiones</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Aquí aparecen las integraciones y patrocinios activos de tu concesionaria.
        </p>
      </header>

      <section className="rounded-2xl border border-nk-border bg-nk-surface p-5 shadow-nk-sm">
        <DealerSponsorshipBanner />
        <p className="text-sm text-nk-fg-muted">
          Si todavía no hay conexiones activas, revisa el estado de tus módulos para ver qué servicios están disponibles.
        </p>
        <Link
          href="/autos/dealer/estado"
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg hover:bg-nk-surface-2"
        >
          Ver estado de módulos
        </Link>
      </section>
    </main>
  );
}
