"use client";

import Link from "next/link";
import { Bell, Moon, PackagePlus, Sun } from "lucide-react";
import { useDccThemeContext } from "@/components/dcc/DccThemeContext";
import { ACCESS_UNVERIFIED_DETAIL, ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";

const BOTON =
  "flex h-11 w-11 items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]";

/**
 * Lo que la barra del dealer (DealerTopbar) daba y la barra común de ModuleShell no tiene (PS-9-CARCASAS-2): el
 * conmutador de tema DCC del panel, las notificaciones del crédito del concesionario y la acción primaria
 * «Publicar vehículo», con los MISMOS permisos. Migas, buscador (Ctrl+K), usuario y menú los pone el armazón común.
 */
export function DealerAcciones({ canPublish, canSeeNotifications }: { canPublish: boolean; canSeeNotifications: boolean }) {
  const tema = useDccThemeContext();
  const siguiente = tema?.theme === "dark" ? "light" : "dark";
  return (
    <div data-testid="dealer-acciones" className="mb-4 flex items-center justify-end gap-1 sm:gap-2">
      {tema ? (
        <button
          type="button"
          data-testid="dealer-theme-toggle"
          onClick={() => tema.setTheme(siguiente)}
          aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
          aria-pressed={tema.theme === "dark"}
          className={BOTON}
        >
          {tema.theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>
      ) : null}
      {canSeeNotifications ? (
        <Link href="/credit-hub/dealer" aria-label="Notificaciones" className={BOTON}>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : null}
      {canPublish ? (
        <Link
          href="/autos/dealer/publicar-rapido"
          aria-label="Publicar vehículo"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand)] px-3 text-sm font-semibold text-[var(--on-brand)] hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:shadow-[var(--ring)] sm:px-4"
        >
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline" aria-hidden="true">Publicar vehículo</span>
        </Link>
      ) : null}
    </div>
  );
}

/** El aviso «No se pudieron verificar tus accesos» que antes iba en el menú del dealer (DealerSidebar). */
export function DealerAvisoAcceso({ reasonCode }: { reasonCode: string }) {
  return (
    <div
      role="alert"
      data-testid="dealer-acceso-no-verificado"
      data-reason-code={reasonCode}
      className="mb-4 rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-partial-bg)] p-3"
    >
      <p className="text-xs font-semibold text-[var(--dcc-partial-fg)]">{ACCESS_UNVERIFIED_MESSAGE}</p>
      <p className="mt-1 text-[11px] leading-snug text-[var(--dcc-partial-fg)]">{ACCESS_UNVERIFIED_DETAIL}</p>
    </div>
  );
}
