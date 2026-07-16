import Link from "next/link";
import { Car } from "lucide-react";

const FOOTER_COLS = [
  {
    title: "Comprar",
    links: [
      { label: "Buscar vehículos", href: "/autos/vehiculos" },
      { label: "Financiamiento", href: "/autos#comparador" },
      { label: "Bancos aliados", href: "/autos#bancos" },
    ],
  },
  {
    title: "Vender",
    links: [
      { label: "Publicar vehículo", href: "/autos#vender" },
      { label: "Guía de precios", href: "/autos/vehiculos" },
      { label: "Tips de venta", href: "/autos#populares" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nadakki", href: "/autos" },
      { label: "Dealers", href: "/autos#dealers" },
      { label: "Prensa", href: "/autos" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Centro de ayuda", href: "/autos" },
      { label: "Contacto", href: "/autos" },
      { label: "Estado del servicio", href: "/autos" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-nk-border bg-nk-surface px-[22px] py-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/autos" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-r-sm bg-gradient-to-br from-brand to-brand-2 text-[var(--on-brand)]">
                <Car className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block font-manrope text-lg font-extrabold text-nk-fg">Nadakki Auto</span>
                <span className="text-xs text-nk-fg-subtle">Hecho en RD 🇩🇴</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-nk-fg-muted">
              Marketplace inteligente con aprobación bancaria integrada para compradores y dealers en
              República Dominicana.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold text-nk-fg">{col.title}</h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-nk-fg-muted transition hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-nk-border pt-6 text-xs text-nk-fg-subtle md:flex-row md:items-center md:justify-between">
          <p>© 2026 Nadakki Auto SRL · RNC 1-31-00000-0 · Cumplimiento LOPD (Ley 172-13)</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/autos" className="hover:text-brand">
              Privacidad
            </Link>
            <Link href="/autos" className="hover:text-brand">
              Términos
            </Link>
            <Link href="/autos" className="hover:text-brand">
              Protección de datos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
