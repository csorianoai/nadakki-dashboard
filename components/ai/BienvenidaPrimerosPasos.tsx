"use client";

/**
 * Bienvenida de onboarding del concesionario: "Primeros pasos: X de 6" con el checklist y el
 * siguiente paso con su enlace. Solo lectura. Se pide una vez por sesion y se vuelve a pedir al
 * instante cuando una pantalla avisa progreso (cargar un auto, vender, invitar...). Si el backend
 * falla, responde sin datos o ya estaba todo hecho, no se muestra nada. "Ahora no" la cierra por la
 * sesion; se reabre solo si sube el numero de pasos hechos. Al llegar a 6 de 6 muestra una vez
 * "¡Listo!" y desaparece para el resto de la sesion.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  bienvenidaCerrada,
  cerrarBienvenida,
  obtenerPrimerosPasos,
  suscribirPrimerosPasos,
  type PrimerosPasos,
} from "@/lib/agents/contable/primeros-pasos-client";

/** Cuanto queda a la vista el "¡Listo!" antes de desaparecer solo. */
export const LISTO_VISIBLE_MS = 8000;

const completo = (d: PrimerosPasos) => !d.siguiente || d.completados >= d.total;

export function BienvenidaPrimerosPasos() {
  const [datos, setDatos] = useState<PrimerosPasos | null>(null);
  const [cerrada, setCerrada] = useState(true);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    let refrescado = false;
    const quitar = suscribirPrimerosPasos((d, antes) => {
      if (!vivo) return;
      refrescado = true;
      if (completo(d)) {
        // Solo se festeja si se conocia un avance incompleto (en esta pestaña): llego a 6 de 6 ahora.
        if (antes !== null && antes < d.total && !bienvenidaCerrada()) {
          cerrarBienvenida(d.total);
          setDatos(d);
          setListo(true);
          setCerrada(false);
        } else {
          setCerrada(true);
        }
        return;
      }
      setDatos(d);
      setCerrada(bienvenidaCerrada());
    });
    if (!bienvenidaCerrada()) {
      setCerrada(false);
      obtenerPrimerosPasos()
        .then((d) => { if (vivo && !refrescado) setDatos(d); })
        .catch(() => { /* falla cerrado */ });
    }
    return () => { vivo = false; quitar(); };
  }, []);

  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => { setListo(false); setCerrada(true); }, LISTO_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [listo]);

  if (listo) {
    return (
      <section
        role="status"
        aria-label="Primeros pasos en Nadakki"
        data-testid="bienvenida-listo"
        className="w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--bg)] p-4 text-[var(--fg)] shadow-lg"
      >
        <p className="text-base font-semibold">¡Listo! Completaste los primeros pasos.</p>
        <button
          type="button"
          onClick={() => { setListo(false); setCerrada(true); }}
          className="mt-3 min-h-11 rounded border border-[var(--dcc-border-strong)] px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]"
        >
          Cerrar
        </button>
      </section>
    );
  }

  if (cerrada || !datos || !datos.siguiente) return null;
  const { siguiente } = datos;

  const cerrar = () => {
    cerrarBienvenida(datos.completados);
    setCerrada(true);
  };

  return (
    <section
      role="region"
      aria-label="Primeros pasos en Nadakki"
      data-testid="bienvenida-primeros-pasos"
      className="w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--bg)] p-4 text-[var(--fg)] shadow-lg"
    >
      <h2 className="text-base font-semibold">
        Primeros pasos: {datos.completados} de {datos.total}
      </h2>
      <p className="mt-1 text-sm">Te mostramos qué te falta para arrancar con tu concesionario.</p>
      <ul className="mt-3 space-y-1.5 text-sm" aria-label="Lista de primeros pasos">
        {datos.pasos.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className={p.hecho ? "text-[var(--dcc-teal)]" : "opacity-60"}>{p.hecho ? "✓" : "○"}</span>
            <span className={p.hecho ? "line-through opacity-70" : ""}>
              <span className="sr-only">{p.hecho ? "Hecho: " : "Pendiente: "}</span>
              {p.paso}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {siguiente.enlace ? (
          <Link
            href={siguiente.enlace}
            aria-label={`Siguiente paso: ${siguiente.paso}`}
            className="inline-flex min-h-11 items-center rounded bg-[var(--dcc-navy)] px-3 text-sm font-semibold text-[var(--dcc-on-navy)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]"
          >
            Siguiente paso: {siguiente.paso}
          </Link>
        ) : (
          <p className="text-sm" data-testid="bienvenida-sin-enlace">
            <span className="font-semibold">Siguiente paso:</span> {siguiente.paso}. Pedíselo a Nadakki.
          </p>
        )}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Ahora no, ocultar primeros pasos"
          className="min-h-11 rounded border border-[var(--dcc-border-strong)] px-3 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--dcc-teal)]"
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}
