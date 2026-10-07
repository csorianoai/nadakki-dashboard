"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  esSuperadminDePlataforma,
  SOLO_SUPERADMIN_DETALLE,
  SOLO_SUPERADMIN_TITULO,
} from "@/lib/auth/platform-staff";

/**
 * Guarda de ruta para las pantallas de administracion de PLATAFORMA: solo
 * `platform_superadmin` ve lo de dentro; el resto ve "Acceso no autorizado".
 *
 * Es la segunda capa: el backend tiene que negar igual. Esto evita que el
 * frontend pinte el panel a quien no le toca.
 *
 * Fail-closed: mientras la sesion carga no se pinta nada de dentro.
 */
export function SoloSuperadminDePlataforma({ children }: { children: ReactNode }) {
  const { allRoles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <p data-testid="solo-superadmin-verificando" role="status" className="p-8 text-sm text-gray-400">
        Verificando acceso…
      </p>
    );
  }

  if (!esSuperadminDePlataforma(allRoles)) {
    return (
      <section data-testid="solo-superadmin-denegado" className="mx-auto max-w-xl p-8">
        <h1 className="text-xl font-semibold text-white">{SOLO_SUPERADMIN_TITULO}</h1>
        <p className="mt-2 text-sm text-gray-400">{SOLO_SUPERADMIN_DETALLE}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
