import m from "@/messages/es/legal-estudio-genio.json";
import { genioCard, genioTitulo } from "./estilo";

const mu = m.muestra;
export const RUTA_MUESTRA = "/muestras/estudio-genio-dossier-muestra-v4.1.pdf";

/** Qué recibe el abogado y el informe de muestra (caso ficticio) para conocer el producto antes de comprarlo. */
export function MuestraGenio() {
  return (
    <section aria-labelledby="genio-muestra" className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_400px] [&>*]:min-w-0">
      <div className={`${genioCard} space-y-4`}>
        <h2 id="genio-muestra" className={genioTitulo}>{mu.titulo}</h2>
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {mu.items.map((t) => (
            <li key={t} className="flex gap-3 text-[15px] leading-snug text-[#3B4558]">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B58A3C]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-[#E3E7EE] pt-3 text-sm text-[#6B7385]">{mu.aviso}</p>
      </div>
      <a
        href={RUTA_MUESTRA}
        target="_blank"
        rel="noopener"
        className="group flex gap-5 rounded-2xl bg-[#17233A] p-6 text-white transition-shadow hover:shadow-[0_24px_48px_-28px_rgba(23,35,58,0.8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3C] focus-visible:ring-offset-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/muestras/estudio-genio-dossier-muestra-portada.webp" alt={mu.alt} width={120} height={155} className="h-[155px] w-[120px] shrink-0 rounded-sm border border-[#B58A3C]/40 object-cover shadow-lg" />
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-[1.4rem] font-semibold leading-tight">{mu.tarjeta}</span>
          <span className="mt-2 text-sm leading-relaxed text-slate-300">{mu.detalle}</span>
          <span className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#B58A3C] px-4 text-sm font-semibold text-[#17233A] group-hover:bg-[#C99D4E]">{mu.abrir}</span>
        </span>
      </a>
    </section>
  );
}
