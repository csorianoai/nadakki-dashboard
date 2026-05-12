"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { TenantProvider } from "@/contexts/TenantContext";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Global provider stack for the entire app.
 *
 * Order matters:
 *   QueryClientProvider  — react-query (must be outermost so all hooks work)
 *     ThemeProvider       — CSS vars / dark mode
 *       AuthProvider      — V2 JWT auth (single instance)
 *         TenantProvider  — tenant context synced from auth
 *           ToastProvider — notifications
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>{children}</ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
