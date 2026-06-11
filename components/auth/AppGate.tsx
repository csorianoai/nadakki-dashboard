"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/consent")) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <>
        <GlobalForgeAppShell>{children}</GlobalForgeAppShell>
        <OnboardingAgent />
      </>
    </ProtectedRoute>
  );
}
