"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { cn } from "@/lib/utils";
import {
  ACCESS_UNVERIFIED_DETAIL,
  ACCESS_UNVERIFIED_MESSAGE,
} from "@/lib/access/reason-codes";
import { isDealerNavItemActive, type DealerNavGroup, type DealerNavItem } from "./dealer-nav";

export type DealerSidebarProps = {
  /** Grupos ya filtrados por entitlements en el shell. */
  groups: DealerNavGroup[];
  loading: boolean;
  /**
   * Reason code cuando el acceso NO se pudo verificar. Con esto el menu vacio
   * deja de ser mudo: no es lo mismo "tu plan no incluye nada" que "no pudimos
   * comprobarlo".
   */
  unverifiedReason?: string | null;
  mobileOpen: boolean;
  onClose: () => void;
};

/** Skeleton gris neutro — avisos 1: nunca un menu falso mientras carga. */
function NavSkeleton() {
  return (
    <div className="space-y-6 px-3 py-4" aria-hidden>
      {[4, 3, 2].map((count, group) => (
        <div key={group} className="space-y-2">
          <div className="mx-3 h-2 w-20 rounded bg-white/10" />
          {Array.from({ length: count }).map((_, item) => (
            <div key={item} className="h-11 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      ))}
    </div>
  );
}

function NavLink({ item, onNavigate }: { item: DealerNavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = isDealerNavItemActive(item.href, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        active
          ? "bg-[var(--nav-bg-2)] font-semibold text-white"
          : "font-medium text-[var(--nav-fg-muted)] hover:bg-white/[0.06] hover:text-[var(--nav-fg)]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Sidebar unico del dealer: marca del tenant arriba, grupos por dominio debajo.
 *
 * Solo pinta los modulos habilitados — el filtrado por entitlements lo hace el
 * shell y llega ya resuelto en `groups`. Fuera del plan => el modulo no aparece
 * en el menu (avisos, seccion 1).
 */
export function DealerSidebar({
  groups,
  loading,
  unverifiedReason = null,
  mobileOpen,
  onClose,
}: DealerSidebarProps) {
  const branding = useDealerManagementBranding();

  // Fallback "Nadakki" mientras carga la marca (pedido BRANDING-PRELOGIN-01).
  const brandName = branding.data?.display_name?.trim() || "Nadakki";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      ) : null}

      <aside
        data-testid="dealer-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] max-w-[85vw] shrink-0 flex-col",
          "bg-[var(--nav-bg)] text-[var(--nav-fg)] transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--nav-border)] px-4 py-4">
          <Link
            href="/autos/dealer"
            onClick={onClose}
            className="flex min-w-0 flex-col rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span className="truncate font-dealer-display text-base font-bold text-white">
              {brandName}
            </span>
            <span className="text-[11px] text-[var(--nav-fg-muted)]">Powered by Nadakki</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--nav-fg-muted)] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <NavSkeleton />
          ) : (
            <nav className="space-y-6 px-3 py-4" aria-label="Navegación del dealer">
              {unverifiedReason ? (
                <div
                  role="alert"
                  data-testid="dealer-acceso-no-verificado"
                  data-reason-code={unverifiedReason}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <p className="text-xs font-semibold text-amber-200">{ACCESS_UNVERIFIED_MESSAGE}</p>
                  <p className="mt-1 text-[11px] leading-snug text-amber-200/80">
                    {ACCESS_UNVERIFIED_DETAIL}
                  </p>
                </div>
              ) : null}
              {groups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <h2 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nav-fg-muted)]">
                    {group.label}
                  </h2>
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} onNavigate={onClose} />
                  ))}
                </div>
              ))}
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
