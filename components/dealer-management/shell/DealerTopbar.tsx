"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, PackagePlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { dealerBreadcrumbFor } from "./dealer-nav";

export type DealerTopbarProps = {
  canPublish: boolean;
  canSeeNotifications: boolean;
  onMenuClick: () => void;
  onSearchClick: () => void;
};

/**
 * Topbar del panel: migas, buscador con atajo, notificaciones y accion primaria.
 *
 * Altura 56 px en celular (ficha 2: la cabecera pegajosa de Excursions ocupaba
 * un tercio de la pantalla). Sin contador en la campana: el agregado de no
 * leidos se conecta en F3 contra /api/v2/credit/applications/.../unread-count;
 * hasta entonces no se pinta ningun numero, porque seria inventado.
 */
export function DealerTopbar({
  canPublish,
  canSeeNotifications,
  onMenuClick,
  onSearchClick,
}: DealerTopbarProps) {
  const pathname = usePathname();
  const crumbs = dealerBreadcrumbFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4 lg:h-16 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav aria-label="Ruta" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex min-w-0 items-center gap-1">
                  {index > 0 ? (
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-[var(--fg-subtle)]"
                      aria-hidden="true"
                    />
                  ) : null}
                  {last ? (
                    <span aria-current="page" className="truncate font-semibold text-[var(--fg)]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate text-[var(--fg-muted)] hover:text-[var(--fg)] hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onSearchClick}
            className={cn(
              "hidden min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm",
              "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] md:inline-flex",
            )}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Buscar</span>
            <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-dealer-numeric text-[11px] text-[var(--fg-subtle)]">
              &#8984;K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] md:hidden"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          {canSeeNotifications ? (
            <Link
              href="/credit-hub/dealer"
              aria-label="Notificaciones"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : null}

          {canPublish ? (
            <Link
              href="/autos/dealer/publicar-rapido"
              /* El nombre accesible vive en aria-label: el texto se oculta en
                 celular por espacio, pero el enlace nunca se queda sin nombre. */
              aria-label="Publicar vehículo"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand)] px-3 text-sm font-semibold text-[var(--on-brand)] hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] sm:px-4"
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline" aria-hidden="true">
                Publicar vehículo
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
