"use client";

import { OnboardingProvider } from "@/components/admin/onboarding/OnboardingProvider";

export default function TenantOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ndk-page min-h-screen px-4 py-6 sm:px-8" data-testid="tenant-onboarding-layout">
      <OnboardingProvider>{children}</OnboardingProvider>
    </div>
  );
}
