"use client";
import Link from "next/link";
import { SelloGenio } from "@/components/legal/cases/estudio-genio/estilo";
import m from "@/messages/es/legal-estudio-genio.json";

/** Acceso al Estudio Genio desde Mi despacho: la única tarjeta oscura de la pantalla. */
export function EstudioGenioTarjeta() {
  return (
    <section aria-labelledby="legal-estudio-genio" className="relative flex h-full flex-col overflow-hidden rounded-xl bg-[#17233A] p-6 text-white shadow-sm">
      <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border border-[#B58A3C]/25" />
      <div className="relative flex items-center gap-4">
        <SelloGenio size={52} />
        <h2 id="legal-estudio-genio" className="font-display text-[1.5rem] font-semibold leading-tight">{m.title}</h2>
      </div>
      <p className="relative mt-4 flex-1 text-sm leading-relaxed text-slate-300">{m.acceso.tarjeta}</p>
      <Link href="/legal/estudio-genio" className="relative mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#B58A3C] px-4 text-sm font-semibold text-[#17233A] transition-colors hover:bg-[#C99D4E] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#17233A]">
        {m.acceso.abrir}
      </Link>
    </section>
  );
}
