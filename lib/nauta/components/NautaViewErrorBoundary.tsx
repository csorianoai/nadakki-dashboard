"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logNautaViewError } from "@/lib/nauta/safeValues";
import { S } from "@/lib/nauta/strings";

interface Props {
  children: ReactNode;
  onReset?: () => void;
  scope?: string;
}

interface State {
  hasError: boolean;
}

/** Catches any throw under the Nauta cockpit — prevents full-page white screen. */
export class NautaViewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logNautaViewError(this.props.scope ?? "view-boundary", error, {
      componentStack: info.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="nauta-view-error" role="alert" data-testid="nauta-view-error-fallback">
          <h2 className="nauta-view-error-title">{S.viewError.title}</h2>
          <p className="nauta-view-error-body">{S.viewError.body}</p>
          <button type="button" className="btn primary" onClick={this.handleReset}>
            {S.viewError.backToPiso}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
