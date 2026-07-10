"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { PanelError } from "../components/PanelFrame";

export class CockpitErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[cockpit:${this.props.title}]`, err, info);
  }

  render() {
    if (this.state.error) {
      return (
        <PanelError
          message={`${this.props.title}: ${this.state.error}`}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
