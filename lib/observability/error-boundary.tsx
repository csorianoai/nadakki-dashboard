"use client";

import { Component, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { captureClientException } from "@/lib/observability/telemetry";

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** Logical segment for Sentry tagging (e.g. `(bank)`, `credit.dealer`). */
  segment: string;
  /** Optional custom fallback; default includes reset. */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/**
 * Route-scoped error boundary: captures to Sentry with segment + shows fallback UI.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error } as BoundaryState;
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureClientException(error, {
      segment: this.props.segment,
      componentStack: info.componentStack?.slice(0, 800),
    });
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.reset });
      }
      return (
        <main className="mx-auto max-w-2xl p-8" role="alert" aria-live="assertive">
          <h1 className="text-xl font-semibold text-forgeGray-900">Algo salió mal</h1>
          <p className="mt-2 text-sm text-forgeGray-600">
            Ocurre en la sección <span className="font-forgeMono text-forgeGray-800">{this.props.segment}</span>. Puedes
            reintentar o recargar la página.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-forgeBrand-600 px-4 py-2 text-sm font-medium text-white hover:bg-forgeBrand-700"
            onClick={this.reset}
          >
            Reintentar
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

/**
 * HOC factory: wraps a client component tree with {@link RouteErrorBoundary}.
 */
export function withRouteErrorBoundary<P extends object>(
  segment: string,
  fallback?: RouteErrorBoundaryProps["fallback"],
): (Inner: ComponentType<P>) => ComponentType<P> {
  return function wrapWithRouteErrorBoundary(Inner: ComponentType<P>): ComponentType<P> {
    const Wrapped = (props: P) => (
      <RouteErrorBoundary segment={segment} fallback={fallback}>
        <Inner {...props} />
      </RouteErrorBoundary>
    );
    Wrapped.displayName = `WithRouteErrorBoundary(${Inner.displayName ?? Inner.name ?? "Component"})`;
    return Wrapped;
  };
}
