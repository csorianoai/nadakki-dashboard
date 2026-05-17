"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Critical queue surface — structured console reporting per RULE 9 */
export class BankQueueErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("bank_queue.boundary_error", {
      message: error.message,
      name: error.name,
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          className="mx-auto max-w-3xl p-8"
          role="alert"
          aria-live="assertive"
          aria-label="Queue error"
        >
          <h1 className="text-xl font-semibold text-forgeGray-900">No se pudo mostrar la bandeja</h1>
          <p className="mt-2 text-forge-sm text-forgeGray-600">
            Actualiza la página o vuelve más tarde. Si el problema continúa, contacta soporte con la hora del error.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-white hover:bg-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
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
