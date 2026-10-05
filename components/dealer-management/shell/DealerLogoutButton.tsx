"use client";

import { useContext, useEffect, useState, type Context } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { AuthContextValue } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

type ContextoV2 = Context<AuthContextValue | null>;

/**
 * "Cerrar sesión" del panel del dealer (QA P1-4: no habia salida visible).
 *
 * Reutiliza el logout de la sesion V2 (`lib/auth/auth-context`), el mismo que
 * llaman el menu del Cockpit y el DealerChShell del Credit Hub: purga borradores
 * con PII, revoca el token en backend y limpia tokens y binding del dealer.
 * Despues navega a /login, como esos dos.
 *
 * El modulo de la sesion V2 se carga en un efecto y no con un import estatico:
 * `lib/auth/auth-context` arrastra `lib/api/auth-v2`, que resuelve la URL del
 * backend AL CARGARSE y lanza sin backend declarado. Con import estatico, todo
 * test que monte el shell (siete suites hoy) caeria antes de renderizar. El
 * objeto de contexto es el mismo: el modulo se evalua una sola vez.
 *
 * Se lee con `useContext` y no con `useAuth` (que lanza): el provider V2 lo pone
 * `AppProviders` en el layout raiz, asi que en produccion siempre existe; sin
 * provider no hay sesion que cerrar y el boton no se pinta.
 */
export function DealerLogoutButton({ collapsed }: { collapsed: boolean }) {
  const [contexto, setContexto] = useState<{ ctx: ContextoV2 } | null>(null);

  useEffect(() => {
    let vivo = true;
    import("@/lib/auth/auth-context")
      .then((mod) => {
        if (vivo) setContexto({ ctx: mod.AuthContext });
      })
      .catch(() => {
        /* Sin backend declarado no hay sesion V2 que cerrar. */
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!contexto) return null;
  return <BotonCerrarSesion ctx={contexto.ctx} collapsed={collapsed} />;
}

function BotonCerrarSesion({ ctx, collapsed }: { ctx: ContextoV2; collapsed: boolean }) {
  const auth = useContext(ctx);
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  if (!auth) return null;

  const cerrarSesion = async () => {
    setSaliendo(true);
    try {
      await auth.logout();
    } catch (error) {
      // El logout V2 no relanza; si algo lo hiciera, la salida no se queda a medias.
      console.error("[dealer] cerrar sesión", error);
    }
    router.push("/login");
  };

  return (
    <button
      type="button"
      data-testid="dealer-logout"
      onClick={() => void cerrarSesion()}
      disabled={saliendo}
      title={collapsed ? "Cerrar sesión" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center rounded-lg text-sm font-medium text-[var(--nav-fg-muted)] transition-colors",
        "hover:bg-[var(--nav-bg-2)] hover:text-[var(--nav-fg)] disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-teal)]",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={collapsed ? "sr-only" : "truncate"}>Cerrar sesión</span>
    </button>
  );
}
