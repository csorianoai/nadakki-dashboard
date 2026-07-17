import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "En menos de un día tenía tres ofertas de banco. Compré mi CR-V sin ir de sucursal en sucursal.",
    name: "María L.",
    role: "Compradora · Santo Domingo",
    initials: "ML",
  },
  {
    quote:
      "El comparador de cuotas me ahorró semanas. Sabía exactamente cuánto pagaría antes de ir al dealer.",
    name: "Carlos R.",
    role: "Comprador · Santiago",
    initials: "CR",
  },
  {
    quote:
      "Como dealer, recibo leads con aprobación pre-calificada. Cierra más rápido y con menos fricción.",
    name: "Ana P.",
    role: "Dealer verificada · La Vega",
    initials: "AP",
  },
] as const;

export function Testimonials() {
  return (
    <section className="px-[22px] py-12">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="font-manrope text-[clamp(22px,3vw,30px)] font-bold text-nk-fg">
          Lo que dicen nuestros usuarios
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className="rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm transition hover:-translate-y-1 hover:shadow-nk-md"
            >
              <div className="flex gap-0.5" aria-label="5 estrellas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-nk-warning text-nk-warning" aria-hidden />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-nk-fg-muted">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {item.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-nk-fg">{item.name}</p>
                  <p className="text-xs text-nk-fg-subtle">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
