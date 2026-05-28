"use client";

import { useAuth } from "@/hooks/useAuth";

export function useContableTenantId(): string | undefined {
  const { tenant } = useAuth();
  const id = tenant?.id?.trim();
  return id || undefined;
}
