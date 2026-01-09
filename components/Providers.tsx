"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TenantProvider } from "@/contexts/TenantContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </TenantProvider>
  );
}

