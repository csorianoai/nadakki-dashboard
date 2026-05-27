"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FINANZAS_TABS = [
  { slug: "", label: "Overview" },
  { slug: "presupuesto", label: "Presupuesto" },
  { slug: "facturas", label: "Facturas" },
  { slug: "cotizaciones", label: "Cotizaciones" },
  { slug: "ordenes-compra", label: "Órdenes de compra" },
  { slug: "pagos", label: "Pagos" },
  { slug: "deals", label: "Deals" },
  { slug: "eventos", label: "Eventos" },
] as const;

export function FinanzasSubNav({ proyectoId }: { proyectoId: string }) {
  const pathname = usePathname();
  const base = `/proyectos/${encodeURIComponent(proyectoId)}/finanzas`;

  return (
    <nav aria-label="Sub-navegación finanzas" className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {FINANZAS_TABS.map(({ slug, label }) => {
        const href = slug ? `${base}/${slug}` : base;
        const active = slug
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === href || pathname === `${href}/`;
        return (
          <Link
            key={slug || "_overview"}
            href={href}
            className={cn(
              "inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
