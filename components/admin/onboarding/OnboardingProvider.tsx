"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { TenantOnboardingRuntimeProvider } from "@/hooks/useTenantOnboarding";

class OnboardingErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("Tenant onboarding error:", error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="ndk-page p-6 max-w-lg mx-auto text-white" data-testid="onboarding-error-boundary">
          <p className="text-lg font-semibold">Algo salió mal en el asistente de alta.</p>
          <p className="text-sm text-gray-400 mt-2 break-words">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  return (
    <OnboardingErrorBoundary>
      <TenantOnboardingRuntimeProvider>{children}</TenantOnboardingRuntimeProvider>
    </OnboardingErrorBoundary>
  );
}
