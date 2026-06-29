"use client";

import type { ReactNode } from "react";
import { EmptyStateRich } from "@/components/credit-hub/primitives";

export interface CHPanelStateProps {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  loadingFallback?: ReactNode;
  errorTitle?: string;
  children: ReactNode;
}

/** Per-panel fetch loading/error — never blocks sibling panels. */
export function CHPanelState({
  isLoading,
  isError,
  onRetry,
  loadingFallback = null,
  errorTitle,
  children,
}: CHPanelStateProps) {
  if (isLoading) return <>{loadingFallback}</>;
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
