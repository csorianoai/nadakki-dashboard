"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DEALER_MANAGEMENT_ROOT } from "@/lib/autos-portal/routes";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

/**
 * Un usuario de concesionario NUNCA ve la Suite operativa.
 *
 * Verificado por Cesar en produccion con cajamapaal+carolina: un usuario de
 * Mapaal veia la Suite con Legal Hub, Nauta, SIC Hub, Proyectos, AI Studio,
 * Advertising Hub, Governance y Administracion.
 *
 * La senal es `GET /api/v1/autos/me/dealer-context`, no el arquetipo de la
 * organizacion (decision de Cesar): `organization_archetype` solo aparece en el
 * POST de creacion y `/auth/me` no lo trae. Con al menos una asignacion de
 * dealer se redirige a `/autos/dealer`.
 *
 * - Mientras consulta pinta "Verificando…": ni un frame de Suite antes de saber.
 * - Si la consulta FALLA no expulsa a nadie: pinta la Suite como antes. Un
 *   backend lento no puede dejar a un administrador fuera de su panel.
 * - Se pregunta una vez por usuario, no en cada navegacion.
 * - Excepcion: las rutas que el menu del dealer enlaza (`/contable/*`) se
 *   pintan sin consultar ni redirigir; ver `isDealerReachableSuitePath`.
 */
/**
 * Pantallas de la Suite a las que el menu del dealer enlaza (`dealer-nav.ts`:
 * Contabilidad, Plan de cuentas, Libro mayor, Balance, Estados financieros).
 * Si el gate expulsara de ellas, cada enlace del menu del dealer lo devolveria
 * a /autos/dealer (D8).
 */
export function isDealerReachableSuitePath(pathname: string | null): boolean {
  return pathname === "/contable" || (pathname?.startsWith("/contable/") ?? false);
}

type Estado = "verificando" | "dealer" | "suite";

export function DealerSuiteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isDealerReachableSuitePath(pathname)) return <>{children}</>;
  return <DealerSuiteGateInner>{children}</DealerSuiteGateInner>;
}

function DealerSuiteGateInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    let cancelado = false;
    setEstado("verificando");
    fetchMyDealerContext()
      .then((asignaciones) => {
        if (!cancelado) setEstado(asignaciones.length > 0 ? "dealer" : "suite");
      })
      .catch((err) => {
        console.warn("[dealer-suite-gate] dealer-context fallo; se pinta la Suite:", err);
        if (!cancelado) setEstado("suite");
      });
    return () => {
      cancelado = true;
    };
  }, [userId]);

  useEffect(() => {
    if (estado === "dealer") router.replace(DEALER_MANAGEMENT_ROOT);
  }, [estado, router]);

  if (estado === "suite") return <>{children}</>;

  return (
    <div
      data-testid={estado === "dealer" ? "suite-redirigiendo-dealer" : "suite-verificando"}
      className="flex min-h-screen items-center justify-center text-sm text-zinc-400"
    >
      {estado === "dealer" ? "Llevándote a tu panel…" : "Verificando…"}
    </div>
  );
}
