"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";
import { isAutosConsumerPublicPath } from "@/lib/autos-portal/routes";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  console.log("🔍 AppGate pathname:", pathname);
  console.log("🔍 isAutosConsumerPublicPath:", isAutosConsumerPublicPath(pathname));

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/consent")) {
    return <>{children}</>;
  }

  // Public Nadakki Auto marketplace (autos.nadakki.com consumer)
  if (isAutosConsumerPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (pathname.startsWith("/cockpit")) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
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
