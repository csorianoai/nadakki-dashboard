"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";
import { isAutosConsumerPublicPath, isDealerManagementPath } from "@/lib/autos-portal/routes";

function getEffectivePathname(pathname: string | null): string {
  if (pathname) {
    return pathname;
  }

  return typeof window !== "undefined" ? window.location.pathname : "";
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = getEffectivePathname(usePathname());

  if (!pathname) {
    return null;
  }

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

  // Panel del dealer: autenticado, pero con su propio chrome. Fuera del
  // GlobalForgeAppShell, que es el que pinta la barra "Suite operativa" con
  // todos los hubs y se apilaba sobre el menu del dealer.
  if (isDealerManagementPath(pathname)) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  if (pathname.startsWith("/cockpit")) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  // Exclude /credit/* paths from GlobalForgeAppShell
  if (pathname === "/credit" || pathname.startsWith("/credit/")) {
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
