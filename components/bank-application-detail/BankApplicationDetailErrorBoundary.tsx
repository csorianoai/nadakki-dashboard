"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureClientException } from "@/lib/observability/telemetry";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class BankApplicationDetailErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureClientException(error, {
      boundary: "bank_application_detail",
      componentStack: info.componentStack?.slice(0, 500),
    });
    console.error("bank_application_detail.boundary_error", {
      message: error.message,
      name: error.name,
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-2xl p-8" role="alert" aria-live="assertive">
          <h1 className="text-xl font-semibold text-forgeGray-900">Error al mostrar el detalle</h1>
          <p className="mt-2 text-forge-sm text-forgeGray-600">
            Intenta recargar la página. Si persiste, reporta la hora del error a soporte.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-white hover:bg-forgeBrand-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
