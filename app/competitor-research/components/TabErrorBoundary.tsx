"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel: string;
}

interface State {
  hasError: boolean;
}

export class TabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[TabErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
          role="alert"
        >
          {this.props.fallbackLabel}
        </div>
      );
    }
    return this.props.children;
  }
}
