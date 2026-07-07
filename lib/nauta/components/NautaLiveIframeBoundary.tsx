"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { S } from "@/lib/nauta/strings";

interface Props {
  children: ReactNode;
  onIframeFault?: () => void;
}

interface State {
  hasError: boolean;
}

/** Isolates live-view iframe faults so post-session errors cannot crash /nauta. */
export class NautaLiveIframeBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onIframeFault?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="live-iframe-fallback" role="status" data-testid="nauta-live-iframe-fallback">
          <p>{S.report.iframeEnded}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
