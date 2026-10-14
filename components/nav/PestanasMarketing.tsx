"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ICONO_PESTANA, PESTANAS_MARKETING, pestanaMarketingActiva } from "@/lib/navigation";

function activa(href: string, pathname: string): boolean {
  const ruta = href.split(/[?#]/)[0]!;
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}

/**
 * Marketing es UNA entrada del menú; dentro, sus pantallas van en pestañas (lib/navigation.ts). Se pinta en
 * cualquier ruta de marketing (marketing, workflows, social, advertising, campaigns, segments…), con la
 * pestaña activa y sus pantallas debajo: dos niveles, nunca más. Fondo oscuro como el menú: la prueba
 * e2e/visual/fondo-continuo exige < 2 % de píxeles claros en el área de contenido (/social).
 */
export function PestanasMarketing() {
  const pathname = usePathname() ?? "";
  const actual = pestanaMarketingActiva(pathname);
  if (!actual) return null;
  return (
    <nav aria-label="Secciones de Marketing" data-testid="pestanas-marketing" className="border-b border-zinc-800 bg-zinc-950 px-4">
      <ul role="tablist" className="flex gap-1 overflow-x-auto pt-2">
        {PESTANAS_MARKETING.map((p) => {
          const Icono = ICONO_PESTANA[p.id];
          const sel = p.id === actual.id;
          return (
            <li key={p.id} role="presentation">
              <Link
                role="tab"
                aria-selected={sel}
                href={p.href}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm font-medium",
                  sel
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-zinc-400 hover:text-zinc-200",
                )}
              >
                {Icono ? <Icono className="h-4 w-4" aria-hidden /> : null}
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-label={`Pantallas de ${actual.label}`} className="flex gap-3 overflow-x-auto py-2 text-xs">
        {actual.paginas.map((pg) => (
          <li key={pg.href}>
            <Link
              href={pg.href}
              aria-current={activa(pg.href, pathname) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded px-2 py-1",
                activa(pg.href, pathname)
                  ? "bg-violet-500/10 text-violet-300"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {pg.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
