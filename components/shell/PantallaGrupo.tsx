"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { grupoDePantalla, menuVisible, moduloDeRuta } from "@/lib/modulos/registro";
import { CLASES } from "./clases";
import { TarjetaPagina } from "./TarjetaPagina";
import { useContextoShell } from "./useContextoShell";

/**
 * Pantalla del GRUPO (`<raiz del módulo>/grupo/<id>`): al entrar en un grupo del menú se ven primero todas sus
 * páginas como tarjetas. El grupo y sus páginas salen del registro, ya filtradas por módulo del tenant y rol
 * (menuVisible), así que una tarjeta nunca ofrece una página que el menú lateral no ofrece.
 */
export default function PantallaGrupo() {
  const pathname = usePathname();
  const { usuario } = useContextoShell();
  const modulo = moduloDeRuta(pathname);
  const grupos = useMemo(() => (modulo ? menuVisible(modulo, usuario) : []), [modulo, usuario]);
  const grupo = modulo ? grupoDePantalla(modulo, grupos, pathname) : null;

  if (!modulo || !grupo) {
    return (
      <section className={CLASES.pantalla} data-testid="pantalla-grupo-vacia">
        <h1 className="text-lg font-semibold text-zinc-100">Este grupo no existe o no tienes acceso</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {modulo ? (
            <Link href={modulo.raiz} className="text-[var(--turquesa-modulo,#0ea5a4)] underline">Volver a {modulo.label}</Link>
          ) : (
            <Link href="/" className="text-[var(--turquesa-modulo,#0ea5a4)] underline">Volver al inicio</Link>
          )}
        </p>
      </section>
    );
  }

  return (
    <section className={CLASES.pantalla} data-testid="pantalla-grupo" data-grupo={grupo.id} aria-labelledby="titulo-grupo">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">{modulo.label}</p>
      <h1 id="titulo-grupo" className="mt-1 text-2xl font-semibold text-zinc-100">{grupo.label}</h1>
      <p className="mt-1 mb-5 text-sm text-zinc-400">{grupo.items.length === 1 ? "1 página" : `${grupo.items.length} páginas`}</p>
      <ul className={CLASES.rejilla} aria-label={`Páginas de ${grupo.label}`}>
        {grupo.items.map((it) => (
          <li key={it.id} className="min-w-0">
            <TarjetaPagina item={it} iconoGrupo={grupo.icono} />
          </li>
        ))}
      </ul>
    </section>
  );
}
