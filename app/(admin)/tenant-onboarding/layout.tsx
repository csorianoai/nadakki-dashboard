"use client";

import { OnboardingProvider } from "@/components/admin/onboarding/OnboardingProvider";
import { SoloSuperadminDePlataforma } from "@/components/auth/SoloSuperadminDePlataforma";

export default function TenantOnboardingLayout({ children }: { children: React.ReactNode }) {
  // Dar de alta un tenant es administracion de plataforma: solo superadmin.
  return (
    <SoloSuperadminDePlataforma>
      <div className="ndk-page min-h-screen px-4 py-6 sm:px-8" data-testid="tenant-onboarding-layout">
        <OnboardingProvider>{children}</OnboardingProvider>
      </div>
    </SoloSuperadminDePlataforma>
  );
}
