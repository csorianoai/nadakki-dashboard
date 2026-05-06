"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { legalApiClient } from "@/lib/api/legal";
import { TASK_FIXTURES } from "@/lib/legal/task-fixtures";
import type { LegalTask } from "@/lib/legal/task-types";
import type { LegalApiError } from "@/types/legal";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export function useLegalTasks(jurisdiction: string = "do") {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const [tasks, setTasks] = useState<LegalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!tenantHydrated) return;
    if (!effectiveTenantId) {
      setTasks([]);
      setLoading(false);
      setError(tenantError ? new Error(tenantError) : new Error("Tenant no disponible"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await legalApiClient.getTasks(effectiveTenantId, jurisdiction);
      setTasks(r.tasks ?? []);
    } catch (e: unknown) {
      const err = e as LegalApiError;
      if (process.env.NODE_ENV === "development") {
        setTasks(TASK_FIXTURES);
        setError(null);
      } else {
        const msg = err?.message || "Error al cargar tareas";
        setError(new Error(msg));
        setTasks([]);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [effectiveTenantId, jurisdiction, tenantError, tenantHydrated]);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  return { tasks, loading, error, refetch, tenantHydrated, effectiveTenantId };
}
