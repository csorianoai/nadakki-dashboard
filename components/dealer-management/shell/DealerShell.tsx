"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isAccessQueryFailClosed } from "@/components/dealer/CoreNavigation";
import { useQuery } from "@tanstack/react-query";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { ACCESS_UNVERIFIED_MESSAGE, isAccessUnverified } from "@/lib/access/reason-codes";
import { syncDealerContextFromBackend } from "@/lib/dealer/dealer-context-api";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";
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

  /**
   * El dealer de la sesion se trae del BACKEND antes de pintar nada que lo lea.
   *
   * Doce ficheros leen el binding del Local Storage, y nadie lo escribia: el
   * login solo guarda el tenant (contexts/AuthContext.tsx:100-112), asi que
   * `resolveDealerAccessContext` devolvia `no_dealer` y las pantallas del dealer
   * se cerraban solas con un contexto vacio. Esta sincronizacion es la que lo
   * rellena, una vez por sesion.
   *
   * Los hijos NO se renderizan mientras esta en vuelo: si se pintaran, leerian
   * el binding viejo --o ninguno-- y decidirian con un dato que esta a punto de
   * cambiar.
   *
   * El tenant se lee en un efecto y no en el render: en el servidor no hay Local
   * Storage, y leerlo durante el render daria un HTML distinto al de la
   * hidratacion. Hasta que `listo` sea true se pinta "Verificando", asi que no
   * queda una ventana en la que los hijos aparezcan sin binding.
   *
   * No se usa `useAuth`: el AuthProvider que envuelve `app/autos`
   * (app/autos/layout.tsx:8) viene de `@/lib/auth-context`, otro modulo, y el
   * hook de `@/hooks/useAuth` lanzaria. El tenant sale de la misma fuente que
   * leen los doce consumidores.
   */
  const [sesion, setSesion] = useState<{ listo: boolean; tenantId: string | null }>({
    listo: false,
    tenantId: null,
  });
  useEffect(() => {
    const resuelto = resolveDealerAccessContext();
    const tenant = resuelto.status === "ready" ? resuelto.context.tenantId : resuelto.tenantId;
    setSesion({ listo: true, tenantId: tenant });
  }, []);
  const tenantId = sesion.tenantId;

  const sync = useQuery({
    queryKey: ["dealer-context-sync", tenantId ?? "none"],
    queryFn: () => syncDealerContextFromBackend(tenantId),
    enabled: Boolean(tenantId),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

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

  /**
   * Mientras la sincronizacion esta en vuelo no se pinta ningun hijo. Y ninguno
   * de los estados de abajo lleva enlace: no hay a donde mandar a alguien que no
   * tiene dealer resuelto.
   */
  const sincronizando = !sesion.listo || (Boolean(tenantId) && (sync.isPending || sync.isLoading));

  const avisoDeContexto = useMemo((): { estado: string; titulo: string; detalle: string | null; codigo: string | null } | null => {
    const salida = sync.data;
    if (!salida) return null;
    if (salida.estado === "sincronizado") return null;
    if (salida.estado === "sin_asignacion") {
      return {
        estado: salida.estado,
        titulo: "Tu usuario no tiene un dealer asignado",
        detalle: "Pide a tu administrador que te asigne un concesionario.",
        codigo: null,
      };
    }
    if (salida.estado === "multiples") {
      return {
        estado: salida.estado,
        titulo: "Tu usuario tiene varios dealers asignados; falta elegir uno",
        detalle: `El backend reportó ${salida.total}. No se elige uno por defecto: sería mostrarte el inventario de otro.`,
        codigo: null,
      };
    }
    if (salida.estado === "error_http") {
      /* El reason_code REAL del backend, o la frase de "no verificado". */
      return isAccessUnverified(salida.reason_code)
        ? { estado: salida.estado, titulo: ACCESS_UNVERIFIED_MESSAGE, detalle: null, codigo: salida.reason_code }
        : {
            estado: salida.estado,
            titulo: "No se pudo leer el dealer de tu sesión",
            detalle: salida.reason_code
              ? `reason_code: ${salida.reason_code}`
              : `El backend respondió HTTP ${salida.status} sin reason_code.`,
            codigo: salida.reason_code,
          };
    }
    if (salida.estado === "forma_invalida") {
      return {
        estado: salida.estado,
        titulo: "No se pudo leer el dealer de tu sesión",
        detalle: "La respuesta del backend no tuvo la forma esperada.",
        codigo: null,
      };
    }
    return {
      estado: salida.estado,
      titulo: "No se pudo identificar tu sesión",
      detalle: "Vuelve a iniciar sesión.",
      codigo: null,
    };
  }, [sync.data]);

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
          {sincronizando ? (
            <p data-testid="dealer-context-verificando" className="animate-pulse text-sm text-[var(--nav-fg-muted)]">
              Verificando
            </p>
          ) : avisoDeContexto ? (
            <section
              role="alert"
              data-testid="dealer-context-aviso"
              data-estado={avisoDeContexto.estado}
              data-reason-code={avisoDeContexto.codigo ?? ""}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              <p className="font-semibold">{avisoDeContexto.titulo}</p>
              {avisoDeContexto.detalle ? (
                <p className="mt-1 text-amber-200/90">{avisoDeContexto.detalle}</p>
              ) : null}
            </section>
          ) : (
            children
          )}
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
