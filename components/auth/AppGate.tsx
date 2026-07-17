"use client";

import { usePathname } from "next/navigation";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { ProtectedRoute } from "@/components/forge/auth/ProtectedRoute";
import { GlobalForgeAppShell } from "@/components/forge/layout/GlobalForgeAppShell";

function isAutosPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/autos") return true;
  if (pathname === "/autos/vehiculos" || pathname.startsWith("/autos/vehiculos/")) return true;
  if (pathname.startsWith("/autos/vehiculo/")) return true;
  return false;
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/consent")) {
    return <>{children}</>;
  }

  // Public Nadakki Auto marketplace (autos.nadakki.com consumer)
  if (isAutosPublicPath(pathname)) {
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
