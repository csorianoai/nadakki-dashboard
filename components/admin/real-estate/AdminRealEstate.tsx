"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isDemoAllowed, isPanelFlagOn } from "@/lib/realtor/config";
import {
  cargarConfiguracion, JURISDICCIONES_DEMO, ROTULO_DEMO, RUTA_AGENTE_WEB, RUTA_ALTA, type Resultado,
} from "@/lib/admin/real-estate";

type Fetcher = (ruta: string, init?: RequestInit) => Promise<Response>;

const TARJETAS = [
  { id: "alta", titulo: "Alta del agente", texto: "Registra al agente y su licencia.", href: RUTA_ALTA },
  { id: "web", titulo: "Web del agente", texto: "Sitio público del agente.", href: RUTA_AGENTE_WEB },
];

const caja = "rounded-xl border border-white/10 bg-white/5 p-5";

export function AdminRealEstate({ enviar, demo = isDemoAllowed(), encendido = isPanelFlagOn() }: {
  enviar?: Fetcher; demo?: boolean; encendido?: boolean;
}) {
  const [res, setRes] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!encendido) return;
    let vivo = true;
    cargarConfiguracion(enviar).then((r) => { if (vivo) setRes(r); });
    return () => { vivo = false; };
  }, [encendido, enviar]);

  // Fail-closed: sin interruptor, sin 200 de /acceso o sin rol de administracion no se pinta nada.
  if (!encendido || !res || !res.acceso) return null;

  const hayReal = res.jurisdicciones !== null;
  const zonas = hayReal ? res.jurisdicciones! : demo ? JURISDICCIONES_DEMO : null;

  return (
    <main data-testid="admin-real-estate" className="mx-auto max-w-4xl space-y-6 p-8 text-white">
      <h1 className="text-2xl font-semibold">Administración › Real Estate</h1>
      <nav aria-label="Accesos" className="grid gap-4 sm:grid-cols-3">
        {TARJETAS.map((t) => (
          <Link key={t.id} href={t.href} data-testid={`tarjeta-${t.id}`} className={`${caja} block hover:bg-white/10`}>
            <h2 className="font-medium">{t.titulo}</h2>
            <p className="mt-1 text-sm text-gray-400">{t.texto}</p>
          </Link>
        ))}
        <section data-testid="tarjeta-zonas" className={caja}>
          <h2 className="font-medium">Zonas y permisos</h2>
          <p className="mt-1 text-sm text-gray-400">Configuración vigente (solo lectura).</p>
        </section>
      </nav>

      <section data-testid="zonas-permisos" className={`${caja} space-y-4`}>
        <h2 className="text-lg font-medium">Zonas y permisos</h2>
        <p data-testid="estado-solo-lectura" className="text-sm text-gray-400">
          Estado: solo lectura. La edición de zonas y permisos aún no está disponible.
        </p>
        <div>
          <h3 className="text-sm font-medium">Jurisdicciones de la licencia</h3>
          {zonas ? (
            <>
              {!hayReal ? <p data-testid="badge-demo" className="text-xs font-semibold text-amber-400">{ROTULO_DEMO}</p> : null}
              <ul data-testid="lista-jurisdicciones" className="mt-1 text-sm">
                {zonas.map((z) => <li key={z}>{z}</li>)}
              </ul>
            </>
          ) : (
            <p data-testid="sin-datos" className="mt-1 text-sm text-gray-400">Sin datos todavía</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium">Roles</h3>
          <ul data-testid="lista-roles" className="mt-1 text-sm">
            {res.roles.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}
