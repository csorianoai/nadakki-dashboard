import { Shield, Sparkles, Star } from "lucide-react";

const PROPS = [
  {
    icon: Shield,
    title: "Aprobación bancaria en 24h",
    desc: "Una sola aplicación, múltiples ofertas de bancos aliados.",
    iconClass: "text-nk-success",
  },
  {
    icon: Sparkles,
    title: "AI Concierge 24/7",
    desc: "Busca en lenguaje natural y recibe recomendaciones personalizadas.",
    iconClass: "text-brand",
  },
  {
    icon: Star,
    title: "Precio Justo verificado",
    desc: "Comparamos cada listado contra el mercado dominicano.",
    iconClass: "text-nk-warning",
  },
] as const;

export function ValueProps() {
  return (
    <section className="px-[22px] py-8">
      <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-3">
        {PROPS.map((item) => (
          <div key={item.title} className="flex gap-4">
            <span
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-r-sm bg-nk-surface-2"
              aria-hidden
            >
              <item.icon className={`h-5 w-5 ${item.iconClass}`} />
            </span>
            <div>
              <h3 className="font-manrope text-base font-bold text-nk-fg">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-nk-fg-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
