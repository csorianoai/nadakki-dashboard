"use client";

import { useAuth } from "@/hooks/useAuth";

/** UUID tenant activo (Auth V2 / Forge); coherente con `hooks/projects/useProyectos`. */
export function useForgeProjectsTenantId(): string | undefined {
  const { tenant } = useAuth();
  const id = tenant?.id?.trim();
  return id || undefined;
}
