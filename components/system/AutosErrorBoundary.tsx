"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { error: Error | null };

export class AutosErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AutosErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <h2 className="font-manrope text-xl font-bold text-nk-fg">
            {this.props.fallbackTitle ?? "Algo salió mal"}
          </h2>
          <p className="mt-2 text-sm text-nk-fg-muted">
            {this.state.error.message || "Error inesperado al cargar esta sección."}
          </p>
          <Button
            variant="brand"
            className="mt-6"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
