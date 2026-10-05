"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
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
  /** Barra estrecha: solo iconos. Lo decide el shell y dura la sesion. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

/** Id del <nav>, para que el boton declare con aria-controls lo que gobierna. */
const NAV_ID = "dealer-sidebar-nav";

/** Skeleton gris neutro — avisos 1: nunca un menu falso mientras carga. */
function NavSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("space-y-6 py-4", collapsed ? "px-2" : "px-3")} aria-hidden>
      {[4, 3, 2].map((count, group) => (
        <div key={group} className="space-y-2">
          {collapsed ? null : <div className="mx-3 h-2 w-20 rounded bg-[var(--nav-bg-2)]" />}
          {Array.from({ length: count }).map((_, item) => (
            <div key={item} className={cn("h-11 rounded-lg bg-[var(--nav-bg-2)]", collapsed && "w-11")} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: DealerNavItem;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = isDealerNavItemActive(item.href, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      /* Tooltip nativo: en barra estrecha el nombre del modulo solo se ve al
         posarse encima. El nombre ACCESIBLE no depende de esto — sigue en el
         <span>, que en estrecha es sr-only: lo lee el lector de pantalla y no
         ocupa sitio. */
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-lg text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-action)]",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-[var(--nav-bg-2)] font-semibold text-[var(--dcc-action)]"
          : "font-medium text-[var(--nav-fg-muted)] hover:bg-[var(--nav-bg-2)] hover:text-[var(--nav-fg)]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );
}

/**
 * Sidebar unico del dealer: marca del tenant arriba, grupos por dominio debajo.
 *
 * Solo pinta los modulos habilitados — el filtrado por entitlements lo hace el
 * shell y llega ya resuelto en `groups`. Fuera del plan => el modulo no aparece
 * en el menu (avisos, seccion 1).
 *
 * DOS EJES INDEPENDIENTES, y conviene no confundirlos:
 *
 *   `collapsed`  — ESCRITORIO. Barra completa (iconos + texto, 264 px) o barra
 *                  estrecha (solo iconos, 72 px, nombre en tooltip). La barra
 *                  sigue EN EL FLUJO (`lg:sticky`), asi que al estrecharse el
 *                  contenido gana ancho: no se le pone nada encima.
 *   `mobileOpen` — CELULAR. La barra es un panel superpuesto, con fondo oscuro
 *                  detras. Aqui `collapsed` no se aplica: un panel que se abre
 *                  para elegir destino no se abre a 72 px de iconos.
 *
 * Por eso el boton de contraer es `lg:block` y la X de cerrar es `lg:hidden`:
 * cada eje tiene su control y en ningun ancho aparecen los dos.
 */
export function DealerSidebar({
  groups,
  loading,
  unverifiedReason = null,
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
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
        data-collapsed={collapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] max-w-[85vw] shrink-0 flex-col",
          "bg-[var(--nav-bg)] text-[var(--nav-fg)] transition-[transform,width] duration-200 motion-reduce:transition-none",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0",
          /* El ancho estrecho va con `lg:` y nunca en celular: alli manda mobileOpen. */
          collapsed && "lg:w-[72px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 border-b border-[var(--nav-border)] py-4",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link
            href="/autos/dealer"
            onClick={onClose}
            title={collapsed ? brandName : undefined}
            className={cn(
              "flex min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-action)]",
              collapsed ? "items-center justify-center" : "flex-col",
            )}
          >
            {collapsed ? (
              <>
                {/* La inicial es decoracion: el nombre accesible es el sr-only. */}
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--nav-bg-2)] font-dealer-display text-base font-bold text-[var(--nav-fg)]"
                >
                  {brandName.charAt(0).toUpperCase()}
                </span>
                <span className="sr-only">{brandName}</span>
              </>
            ) : (
              <>
                <span className="truncate font-dealer-display text-base font-bold text-[var(--nav-fg)]">
                  {brandName}
                </span>
                <span className="text-[11px] text-[var(--nav-fg-muted)]">Powered by Nadakki</span>
              </>
            )}
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--nav-fg-muted)] hover:bg-[var(--nav-bg-2)] hover:text-[var(--nav-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-action)] lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Contraer/expandir: solo escritorio. En celular el eje es mobileOpen. */}
        <div
          className={cn(
            "hidden border-b border-[var(--nav-border)] py-2 lg:block",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <button
            type="button"
            data-testid="dealer-sidebar-toggle"
            onClick={onToggleCollapsed}
            /* aria-expanded describe la BARRA que gobierna, no el boton:
               true = barra completa. El aria-label dice la accion, que es lo
               que necesita oir quien navega con lector de pantalla. */
            aria-expanded={!collapsed}
            aria-controls={NAV_ID}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className={cn(
              "flex min-h-9 w-full items-center rounded-lg text-[var(--nav-fg-muted)] transition-colors hover:bg-[var(--nav-bg-2)] hover:text-[var(--nav-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-action)]",
              collapsed ? "justify-center" : "justify-end px-2",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <NavSkeleton collapsed={collapsed} />
          ) : (
            <nav
              id={NAV_ID}
              className={cn("space-y-6 py-4", collapsed ? "px-2" : "px-3")}
              aria-label="Navegación del dealer"
            >
              {unverifiedReason ? (
                /* En estrecha la frase no cabe en 72 px: queda el icono, la
                   frase en el tooltip y el texto entero en sr-only, igual que
                   el nombre de los modulos. El aviso no desaparece. */
                <div
                  role="alert"
                  data-testid="dealer-acceso-no-verificado"
                  data-reason-code={unverifiedReason}
                  title={collapsed ? ACCESS_UNVERIFIED_MESSAGE : undefined}
                  className={cn(
                    "rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-partial-bg)]",
                    collapsed ? "flex justify-center p-2" : "p-3",
                  )}
                >
                  {collapsed ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--dcc-partial-fg)]" aria-hidden="true" />
                  ) : null}
                  <p className={collapsed ? "sr-only" : "text-xs font-semibold text-[var(--dcc-partial-fg)]"}>
                    {ACCESS_UNVERIFIED_MESSAGE}
                  </p>
                  <p
                    className={
                      collapsed ? "sr-only" : "mt-1 text-[11px] leading-snug text-[var(--dcc-partial-fg)]"
                    }
                  >
                    {ACCESS_UNVERIFIED_DETAIL}
                  </p>
                </div>
              ) : null}
              {groups.map((group, index) => (
                <div key={group.id} className="space-y-1">
                  {collapsed ? (
                    /* En estrecha el titulo del grupo no cabe. Lo sustituye una
                       linea entre grupos: separa sin fingir una etiqueta
                       recortada a tres letras. El nombre del grupo sigue
                       estando en la paleta (Cmd+K), que no se estrecha. */
                    index > 0 ? (
                      <hr className="mx-2 border-[var(--nav-border)]" aria-hidden="true" />
                    ) : null
                  ) : (
                    <h2 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nav-fg-muted)]">
                      {group.label}
                    </h2>
                  )}
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onClose} />
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
