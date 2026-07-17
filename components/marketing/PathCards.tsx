import Link from "next/link";
import { ArrowRight, Banknote, Car, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const PATHS = [
  {
    title: "Compra con financiamiento",
    desc: "Pre-aprueba en tu banco y encuentra el vehículo que califica.",
    href: "/autos/vehiculos",
    icon: Banknote,
    iconBg: "bg-brand-soft text-brand",
  },
  {
    title: "Vende tu vehículo",
    desc: "Publica gratis y llega a compradores con aprobación bancaria.",
    href: "/autos#vender",
    icon: Car,
    iconBg: "bg-nk-surface-2 text-nk-fg",
  },
  {
    title: "Aplicar como Dealer",
    desc: "Únete a la red verificada de concesionarios en RD.",
    href: "/autos#dealers",
    icon: Store,
    iconBg: "bg-nk-success/15 text-nk-success",
  },
] as const;

export function PathCards() {
  return (
    <section className="px-[22px] py-10">
      <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-3">
        {PATHS.map((path) => (
          <Link
            key={path.title}
            href={path.href}
            className={cn(
              "group flex flex-col rounded-r border border-nk-border bg-nk-surface p-5 shadow-nk-sm transition duration-200",
              "hover:-translate-y-1 hover:shadow-nk-lg",
            )}
          >
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-r-sm",
                path.iconBg,
              )}
            >
              <path.icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-manrope text-[17px] font-bold text-nk-fg">{path.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-nk-fg-muted">{path.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
              Empezar
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
