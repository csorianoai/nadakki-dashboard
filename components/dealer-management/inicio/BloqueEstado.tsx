"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Inbox, Lock, Settings2 } from "lucide-react";
import { COPY_BLOQUE, type BloqueEstado as Estado } from "@/lib/dealer-management/bloque-estado";

/** Skeleton gris neutro. Nunca un numero mientras carga (ficha 2). */
export function BloqueSkeleton({ lineas = 2 }: { lineas?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lineas }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-[var(--surface-3)]" style={{ width: `${90 - i * 20}%` }} />
      ))}
    </div>
  );
}

export type BloqueEstadoViewProps = {
  estado: Estado;
  onReintentar?: () => void;
  /** Etiqueta accesible del bloque, para que el aviso tenga contexto. */
  titulo: string;
};

/**
 * Pinta los casos de la tabla 1 de avisos. Cada caso tiene su propio mensaje;
 * no se mezclan. Solo "Error" ofrece reintento — "No disponible aun" y
 * "Falta configuracion" no, porque reintentar no cambia nada.
 */
export function BloqueEstadoView({ estado, onReintentar, titulo }: BloqueEstadoViewProps) {
  if (estado.caso === "ok") return null;

  if (estado.caso === "cargando") {
    return <BloqueSkeleton />;
  }

  if (estado.caso === "vacio") {
    return (
      <div className="flex flex-col items-start gap-2 text-sm">
        <Inbox className="h-5 w-5 text-[var(--fg-subtle)]" aria-hidden="true" />
        <p className="text-[var(--fg-muted)]">{estado.motivo}</p>
        {estado.accion ? (
          <Link
            href={estado.accion.href}
            className="inline-flex min-h-11 items-center font-semibold text-[var(--brand)] underline underline-offset-2"
          >
            {estado.accion.texto}
          </Link>
        ) : null}
      </div>
    );
  }

  if (estado.caso === "no_disponible") {
    return (
      <div className="flex items-start gap-2 text-sm" data-caso="no_disponible">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
        <p className="text-[var(--fg-muted)]">
          {COPY_BLOQUE.no_disponible}
          {estado.pedido ? (
            <span className="sr-only"> Pedido al backend: {estado.pedido}.</span>
          ) : null}
        </p>
      </div>
    );
  }

  if (estado.caso === "falta_configuracion") {
    return (
      <div className="flex items-start gap-2 text-sm" data-caso="falta_configuracion">
        <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        <p className="text-[var(--fg-muted)]">{COPY_BLOQUE.falta_configuracion}</p>
      </div>
    );
  }

  if (estado.caso === "fuera_del_plan") {
    return (
      <div className="flex items-start gap-2 text-sm" data-caso="fuera_del_plan">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden="true" />
        <p className="text-[var(--fg-muted)]">{COPY_BLOQUE.fuera_del_plan}</p>
      </div>
    );
  }

  if (estado.caso === "error_validacion") {
    return (
      <p role="alert" className="text-sm text-[var(--danger)]" data-caso="error_validacion">
        {estado.mensaje}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 text-sm" data-caso="error">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
        <p role="alert" className="text-[var(--fg)]">
          {COPY_BLOQUE.error}
        </p>
      </div>
      {onReintentar ? (
        <button
          type="button"
          onClick={onReintentar}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-3 font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
          aria-label={`${COPY_BLOQUE.reintentar} ${titulo}`}
        >
          {COPY_BLOQUE.reintentar}
        </button>
      ) : null}
    </div>
  );
}
