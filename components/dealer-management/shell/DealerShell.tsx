"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DEALER_NAV_CAPABILITY_KEYS, DEALER_NAV_GROUPS } from "./dealer-nav";
import { DealerCommandPalette } from "./DealerCommandPalette";
import { DealerSidebar } from "./DealerSidebar";
import { DealerTopbar } from "./DealerTopbar";

/**
 * Chrome unico del panel del dealer.
 *
 * Reemplaza las tres navegaciones que se solapaban en /autos/dealer:
 *   1. sidebar global de cores (GlobalForgeAppShell -> ForgeGlobalCoresSidebar)
 *   2. barra del marketplace (app/autos/layout.tsx -> TopNav)
 *   3. menu "Dealer Management" del layout viejo de /autos/dealer
 *
 * El contenedor lleva data-portal="dealer": los tokens y las fuentes del panel
 * viven en ese scope y no tocan el marketplace publico (data-portal="autos").
 *
 * ENTITLEMENTS: se usa `useAccessEntitlementsBatch` de la capa de acceso comun.
 * #504 traia un hook propio (`useDealerShellEntitlements`) porque entonces
 * `accessQueryKey` no incluia las claves pedidas: todas las llamadas de una
 * pantalla compartian UNA entrada de react-query, ganaba la que montaba antes
 * --la pagina, no el shell-- y el menu se quedaba sin decisiones, cayendo a
 * fail-closed siempre. Ese defecto YA ESTA ARREGLADO en staging:
 * `accessBatchQueryKey` (lib/access/hooks.ts) anade `"capabilities"` mas el
 * conjunto ordenado de claves, y lo fija
 * `tests/lib/access/access-batch-query-key.test.ts` con el caso "different
 * capability sets do not share one cache entry". Traer el hook de #504 ahora
 * seria una peticion extra y una clave de cache divergente sin defecto que
 * justifiquen ninguna de las dos.
 *
 * El resultado se reparte a sidebar, topbar y paleta por props, para que los
 * tres filtren exactamente igual.
 */
export function DealerShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const query = useAccessEntitlementsBatch(DEALER_NAV_CAPABILITY_KEYS);
  const failClosed = isAccessQueryFailClosed(query);
  const loading = query.isPending || query.isLoading;
  const results = query.data?.results;

  /** El frontend restringe: sin permiso explicito, no se pinta. */
  const allows = useCallback(
    (capability: string | null) => {
      if (capability === null) return true;
      if (failClosed) return false;
      return results?.[capability]?.allowed === true;
    },
    [failClosed, results],
  );

  // Atajo global de la paleta. Cmd+K en mac, Ctrl+K en el resto.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(
    () =>
      DEALER_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => allows(item.capability)),
      })).filter((group) => group.items.length > 0),
    [allows],
  );

  // La paleta solo ofrece lo que el plan permite: mismo filtro que el sidebar.
  const paletteItems = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => ({ group: group.label, item }))),
    [groups],
  );

  return (
    <div
      data-portal="dealer"
      className="flex min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)] antialiased"
    >
      <DealerSidebar
        groups={groups}
        loading={loading}
        mobileOpen={mobileNav}
        onClose={() => setMobileNav(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DealerTopbar
          canPublish={allows("autos.inventory.create")}
          canSeeNotifications={allows("credit.applications.view")}
          onMenuClick={() => setMobileNav(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        {/* Contenedor, no <main>: cada pagina del dealer ya aporta su propio
            landmark <main>, y anidarlos seria HTML invalido. */}
        <div id="dealer-main" className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          {children}
        </div>
      </div>

      <DealerCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
      />
    </div>
  );
}
