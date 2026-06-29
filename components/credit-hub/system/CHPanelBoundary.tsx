"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { EmptyStateRich } from "@/components/credit-hub/primitives";

interface CHPanelBoundaryProps {
  children: ReactNode;
  /** Short label shown when this panel crashes (e.g. "Ranking de bancos"). */
  label?: string;
}

interface CHPanelBoundaryState {
  error: Error | null;
}

/**
 * Isolates a Credit Hub dashboard section: a render throw here must not
 * blank the entire dealer/bank cockpit.
 */
export class CHPanelBoundary extends Component<CHPanelBoundaryProps, CHPanelBoundaryState> {
  state: CHPanelBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CHPanelBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[CHPanelBoundary]", this.props.label ?? "panel", error, info.componentStack);
    }
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        <EmptyStateRich
          variant="error"
          title={this.props.label ? `${this.props.label} no disponible` : undefined}
          description="Esta sección falló al renderizar. El resto del cockpit sigue operativo."
          primary={
            <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={this.reset}>
              Reintentar sección
            </button>
          }
        />
      );
    }
    return this.props.children;
  }
}
