"use client";

import type { ReactNode } from "react";
import { EmptyStateRich } from "@/components/credit-hub/primitives";

export interface CHPanelStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isUnavailable?: boolean;
  onRetry?: () => void;
  loadingFallback?: ReactNode;
  errorTitle?: string;
  unavailableTitle?: string;
  unavailableDescription?: string;
  loadingLabel?: string;
  children: ReactNode;
}

/** Per-panel fetch loading/error — never blocks sibling panels. */
export function CHPanelState({
  isLoading,
  isError,
  isUnavailable,
  onRetry,
  loadingFallback = null,
  errorTitle,
  unavailableTitle = "No disponible",
  unavailableDescription = "Este módulo aún no está conectado en este entorno. El resto del cockpit sigue operativo.",
  loadingLabel,
  children,
}: CHPanelStateProps) {
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    if (loadingLabel) {
      return (
        <p style={{ fontSize: 13, color: "var(--ch-text-3)", margin: "8px 0 16px" }} role="status">
          {loadingLabel}
        </p>
      );
    }
    return null;
  }
  if (isUnavailable) {
    return (
      <EmptyStateRich
        variant="placeholder"
        title={unavailableTitle}
        description={unavailableDescription}
      />
    );
  }
  if (isError) {
    return (
      <EmptyStateRich
        variant="error"
        title={errorTitle}
        primary={
          onRetry ? (
            <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={onRetry}>
              Reintentar
            </button>
          ) : undefined
        }
      />
    );
  }
  return <>{children}</>;
}
