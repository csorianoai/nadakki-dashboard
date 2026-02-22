"use client";

import { usePathname } from "next/navigation";
import RequireAuth from "./RequireAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import PWAPrompt from "@/components/pwa/PWAPrompt";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <RequireAuth>
      <DashboardLayout>
        {children}
      </DashboardLayout>
      <OnboardingAgent />
      <PWAPrompt />
    </RequireAuth>
  );
}
