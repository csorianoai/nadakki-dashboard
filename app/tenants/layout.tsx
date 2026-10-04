"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  esPersonalDePlataforma,
  SOLO_PLATAFORMA_DETALLE,
  SOLO_PLATAFORMA_TITULO,
} from "@/lib/auth/platform-staff";

/**
 * `/tenants` y `/tenants/[tenantId]` son superficie de PLATAFORMA.
 *
 * Hallazgo del auditor 2, confirmado en `app/tenants/page.tsx`: `TENANTS_INITIAL`
 * pinta cuatro tenants literales inventados con API keys `sk-...-xxx`, y un
 * usuario de Mapaal llegaba aqui desde "Cambiar tenant". El layout cubre las dos
 * rutas de una vez.
 *
 * Cerrar la puerta NO vuelve reales los datos de dentro: eso sigue siendo un
 * defecto aparte, que ve solo el personal de plataforma.
 *
 * Fail-closed: mientras la sesion carga no se pinta nada de dentro, y sin roles
 * de plataforma tampoco.
 */
export default function TenantsLayout({ children }: { children: ReactNode }) {
  const { allRoles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <p data-testid="tenants-verificando" className="p-8 text-sm text-gray-400">
        Verificando acceso…
      </p>
    );
  }

  if (!esPersonalDePlataforma(allRoles)) {
    return (
      <section data-testid="tenants-solo-plataforma" className="mx-auto max-w-xl p-8">
        <h1 className="text-xl font-semibold text-white">{SOLO_PLATAFORMA_TITULO}</h1>
        <p className="mt-2 text-sm text-gray-400">{SOLO_PLATAFORMA_DETALLE}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
