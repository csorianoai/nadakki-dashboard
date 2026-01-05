"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TenantProvider } from "@/context/TenantContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </TenantProvider>
  );
}
