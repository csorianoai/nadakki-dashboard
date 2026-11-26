"use client";
import Link from "next/link";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { EstudioGenioCompras } from "@/components/legal/cases/EstudioGenioCompras";
import { CabeceraGenio, genioCard, genioTitulo } from "@/components/legal/cases/estudio-genio/estilo";
import m from "@/messages/es/legal-estudio-genio.json";

const a = m.acceso;

/** Entrada al Estudio Genio desde el menú: saldo y compras del despacho, y el expediente a estudiar. */
export default function EstudioGenioInicio() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const casesQ = useLegalCases(effectiveTenantId);
  if (!tenantHydrated) return <p role="status" className="p-6">{m.loading}</p>;
  if (!effectiveTenantId || tenantError) return <p role="alert" className="p-6">{m.tenant}</p>;
  const casos = casesQ.data?.cases ?? [];
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1600px] space-y-6 pb-24 text-[#17233A]">
      <CabeceraGenio titulo={m.title} texto={m.about} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px] [&>*]:min-w-0">
        <section aria-labelledby="genio-elegir" className={`${genioCard} space-y-4`}>
          <div>
            <h2 id="genio-elegir" className={genioTitulo}>{a.elegir}</h2>
            <p className="mt-1 text-sm text-[#3B4558]">{a.elegirAyuda}</p>
          </div>
          {casesQ.isLoading ? (
            <div aria-busy="true" className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-[#F5F7FA]" />)}</div>
          ) : casesQ.error ? (
            <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{a.errorCasos}</p>
          ) : casos.length === 0 ? (
            <p className="text-sm text-[#3B4558]">{a.sinCasos} <Link href="/legal/cases/new" className="font-semibold text-[#17233A] underline">{a.crear}</Link></p>
          ) : (
            <ul className="divide-y divide-[#E3E7EE] overflow-hidden rounded-xl border border-[#E3E7EE]">
              {casos.map((c) => (
                <li key={c.case_id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#F5F7FA]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.title}</p>
                    <p className="truncate text-xs text-[#6B7385]">{c.case_number_internal || "Sin número interno"}</p>
                  </div>
                  <Link href={`/legal/cases/${encodeURIComponent(c.case_id)}/estudio-genio`} className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-[#C9CFDA] px-4 text-sm font-semibold hover:border-[#17233A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3C]">
                    {a.estudiar}<span className="sr-only"> {c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/legal/cases" className="inline-block text-sm font-semibold text-[#8A6A2C] hover:underline">{a.verTodos}</Link>
        </section>
        <EstudioGenioCompras tenantId={effectiveTenantId} />
      </div>
    </main>
  );
}
