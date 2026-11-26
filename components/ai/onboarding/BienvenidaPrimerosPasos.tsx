"use client";

/**
 * Tarjeta generica de primeros pasos (motor de onboarding): "Primeros pasos: X de N" con el checklist y el siguiente
 * paso con su enlace. Solo lectura. Se pide una vez por sesion y se vuelve a pedir al instante cuando una pantalla
 * avisa progreso. Si el backend falla, responde sin datos, el core no esta activo (404) o ya estaba todo hecho, no
 * se muestra nada. "Ahora no" la cierra por la sesion; se reabre solo si sube el numero de pasos hechos. Al
 * completar muestra una vez "¡Listo!" y desaparece para el resto de la sesion.
 *
 * Variantes: "flotante" (Autos, encima del boton del asistente) y "en-linea" (Legal, arriba del contenido, para no
 * pisar el globo NADA).
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import { clientePrimerosPasos, type PrimerosPasos } from "@/lib/agents/onboarding/primeros-pasos-client";
import type { CoreOnboarding } from "@/lib/agents/onboarding/progreso";

/** Cuanto queda a la vista el "¡Listo!" antes de desaparecer solo. */
export const LISTO_VISIBLE_MS = 8000;

const completo = (d: PrimerosPasos) => !d.siguiente || d.completados >= d.total;

const ESTILOS = {
  flotante: {
    caja: "w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--bg)] p-4 text-[var(--fg)] shadow-lg",
    hecho: "text-[var(--dcc-teal)]",
    secundario: "min-h-11 rounded border border-[var(--dcc-border-strong)] px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]",
    primario: "inline-flex min-h-11 items-center rounded bg-[var(--dcc-navy)] px-3 text-sm font-semibold text-[var(--dcc-on-navy)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]",
  },
  "en-linea": {
    caja: "mb-4 w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-900",
    hecho: "text-violet-700",
    secundario: "min-h-11 rounded-lg border border-slate-300 px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-violet-600",
    primario: "inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-violet-600",
  },
} as const;

export type VarianteBienvenida = keyof typeof ESTILOS;

export function BienvenidaPrimerosPasos({ core, variante = "flotante" }: { core: CoreOnboarding; variante?: VarianteBienvenida }) {
  const cliente = clientePrimerosPasos(core);
  const cfg = cliente.config;
  const e = ESTILOS[variante];
  const [datos, setDatos] = useState<PrimerosPasos | null>(null);
  const [cerrada, setCerrada] = useState(true);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    let refrescado = false;
    const quitar = cliente.suscribir((d, antes) => {
      if (!vivo) return;
      refrescado = true;
      if (completo(d)) {
        // Solo se festeja si se conocia un avance incompleto (en esta pestaña): se completo ahora.
        if (antes !== null && antes < d.total && !cliente.cerrada()) {
          cliente.cerrar(d.total);
          setDatos(d);
          setListo(true);
          setCerrada(false);
        } else {
          setCerrada(true);
        }
        return;
      }
      setDatos(d);
      setCerrada(cliente.cerrada());
    });
    if (!cliente.cerrada()) {
      setCerrada(false);
      cliente.obtener()
        .then((d) => { if (vivo && !refrescado) setDatos(d); })
        .catch(() => { /* falla cerrado */ });
    }
    return () => { vivo = false; quitar(); };
  }, [cliente]);

  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => { setListo(false); setCerrada(true); }, LISTO_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [listo]);

  if (listo) {
    return (
      <section role="status" aria-label="Primeros pasos en Nadakki" data-testid="bienvenida-listo" data-core={core === "autos" ? undefined : core} className={e.caja}>
        <p className="text-base font-semibold">¡Listo! Completaste los primeros pasos.</p>
        <button type="button" onClick={() => { setListo(false); setCerrada(true); }} className={`mt-3 ${e.secundario}`}>
          Cerrar
        </button>
      </section>
    );
  }

  if (cerrada || !datos || !datos.siguiente) return null;
  const { siguiente } = datos;
  const titulo = (cfg.tituloDelBackend && datos.titulo) || "Primeros pasos";

  const cerrar = () => {
    cliente.cerrar(datos.completados);
    setCerrada(true);
  };

  return (
    <section role="region" aria-label="Primeros pasos en Nadakki" data-testid="bienvenida-primeros-pasos" data-core={core === "autos" ? undefined : core} className={e.caja}>
      <h2 className="text-base font-semibold">
        {titulo}: {datos.completados} de {datos.total}
      </h2>
      <p className="mt-1 text-sm">{cfg.subtitulo}</p>
      <ul className="mt-3 space-y-1.5 text-sm" aria-label="Lista de primeros pasos">
        {datos.pasos.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className={p.hecho ? e.hecho : "opacity-60"}>{p.hecho ? "✓" : "○"}</span>
            <span className={p.hecho ? "line-through opacity-70" : ""}>
              <span className="sr-only">{p.hecho ? "Hecho: " : p.opcional ? "Opcional: " : "Pendiente: "}</span>
              {p.paso}
              {p.opcional ? " (opcional)" : null}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {siguiente.enlace ? (
          <Link href={siguiente.enlace} aria-label={`Siguiente paso: ${siguiente.paso}`} className={e.primario}>
            Siguiente paso: {siguiente.paso}
          </Link>
        ) : (
          <p className="text-sm" data-testid="bienvenida-sin-enlace">
            <span className="font-semibold">Siguiente paso:</span> {siguiente.paso}. {cfg.pedir}
          </p>
        )}
        <button type="button" onClick={cerrar} aria-label="Ahora no, ocultar primeros pasos" className={e.secundario}>
          Ahora no
        </button>
      </div>
    </section>
  );
}
