"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOKENS_AVISO_ACCESO, varDcc } from "@/components/auth/aviso-acceso";
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
 *
 * `rutasExentas`: rutas (y sus subrutas) que la pagina protege por su cuenta
 * con su propia lista de roles; aqui se dejan pasar sin exigir superadmin.
 */
export function SoloSuperadminDePlataforma({
  children,
  rutasExentas = [],
}: {
  children: ReactNode;
  rutasExentas?: string[];
}) {
  const { allRoles, isLoading } = useAuth();
  const pathname = usePathname();

  if (pathname && rutasExentas.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <p data-testid="solo-superadmin-verificando" role="status" className="p-8 text-sm text-gray-400">
        Verificando acceso…
      </p>
    );
  }

  if (!esSuperadminDePlataforma(allRoles)) {
    return (
      <section data-testid="solo-superadmin-denegado" className="mx-auto max-w-xl rounded-xl p-8" style={{ background: varDcc(TOKENS_AVISO_ACCESO.fondo) }}>
        <h1 className="text-xl font-semibold" style={{ color: varDcc(TOKENS_AVISO_ACCESO.titulo) }}>{SOLO_SUPERADMIN_TITULO}</h1>
        <p className="mt-2 text-sm" style={{ color: varDcc(TOKENS_AVISO_ACCESO.detalle) }}>{SOLO_SUPERADMIN_DETALLE}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--dcc-teal-ink,#0F766E)] underline">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
