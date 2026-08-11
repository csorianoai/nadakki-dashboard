"use client";

import { Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmptyStateRichProps, EmptyStateVariant } from "@/lib/credit-hub/ch-types";

function EmptyArt({ variant }: { variant: EmptyStateVariant }) {
  const accent =
    variant === "error" ? "var(--ch-danger)" : variant === "placeholder" ? "var(--ch-persona)" : "var(--ch-accent-mid)";
  const soft =
    variant === "error" ? "var(--ch-danger-soft)" : variant === "placeholder" ? "var(--ch-persona-soft)" : "var(--ch-accent-soft)";

  return (
    <svg width="96" height="72" viewBox="0 0 96 72" fill="none" aria-hidden="true">
      <rect x="16" y="14" width="64" height="44" rx="6" fill={soft} stroke={accent} strokeWidth="1.5" />
      {variant === "error" ? (
        <>
          <path d="M48 28v10" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="48" cy="45" r="1.6" fill={accent} />
        </>
      ) : variant === "filter-empty" ? (
        <>
          <circle cx="44" cy="34" r="9" stroke={accent} strokeWidth="2" />
          <path d="M51 41l6 6" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : variant === "placeholder" ? (
        <>
          <path d="M34 36h28M48 26v20" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
        </>
      ) : (
        <>
          <rect x="30" y="30" width="36" height="3.5" rx="1.75" fill={accent} opacity="0.5" />
          <rect x="30" y="39" width="22" height="3.5" rx="1.75" fill={accent} opacity="0.3" />
        </>
      )}
    </svg>
  );
}

const COPY: Record<EmptyStateVariant, { t: string; b: string }> = {
  empty: {
    t: "Sin solicitudes en la bandeja",
    b: "Cuando lleguen nuevas solicitudes de crédito aparecerán aquí, priorizadas por SLA y riesgo.",
  },
  error: {
    t: "No se pudo cargar la información",
    b: "Ocurrió un problema al consultar el servicio. Reintenta o contacta a soporte si persiste.",
  },
  "filter-empty": {
    t: "Ningún resultado con esos filtros",
    b: "Ajusta los criterios de búsqueda o limpia los filtros para ver todas las solicitudes.",
  },
  placeholder: {
    t: "Próximamente",
    b: "Este módulo se habilitará en una fase posterior. El chasis ya está listo para recibirlo.",
  },
};

export function EmptyStateRich({
  variant = "empty",
  title,
  body,
  description,
  primary,
  secondary,
  action,
  className,
}: EmptyStateRichProps) {
  const copy = COPY[variant];
  const resolvedTitle = title ?? copy.t;
  const resolvedBody = body ?? description ?? copy.b;

  return (
    <div
      className={cn("ch-card", className)}
      style={{ padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
    >
      <EmptyArt variant={variant} />
      <div style={{ fontSize: "var(--ch-text-lg)", fontWeight: 600, marginTop: 8 }}>{resolvedTitle}</div>
      <div style={{ fontSize: "var(--ch-text-sm)", color: "var(--ch-text-3)", maxWidth: 380, lineHeight: 1.5 }}>{resolvedBody}</div>
      {(primary || secondary || action || variant === "filter-empty" || (variant === "error" && !primary)) && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {variant === "error" && !primary ? (
            <button type="button" className="ch-btn ch-btn-secondary">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Reintentar
            </button>
          ) : variant === "filter-empty" ? (
            <button type="button" className="ch-btn ch-btn-secondary">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Limpiar filtros
            </button>
          ) : null}
          {primary}
          {secondary}
          {action}
        </div>
      )}
    </div>
  );
}
