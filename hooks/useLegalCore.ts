"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { legalApiClient } from "@/lib/api/legal";
import type {
  AgentRunResponse,
  AuditTrailEntry,
  KnowledgePackStatus,
  LegalAgent,
  LegalApiError,
  LegalHealthResponse,
} from "@/types/legal";

const DEV_FALLBACK_TENANT =
  process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID?.trim() || undefined) : undefined;

/** Fix #3: nunca llamar API sin tenant resuelto (salvo hidratación). */
export function useLegalEffectiveTenantId(): {
  effectiveTenantId: string | undefined;
  tenantHydrated: boolean;
  tenantError: string | null;
} {
  const { tenantId } = useTenant();
  const [hydrated, setHydrated] = useState(false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const tid = tenantId?.trim() || "";

  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (tid || DEV_FALLBACK_TENANT) return;
    const timer = setTimeout(() => {
      setTimeoutError("No se pudo determinar el tenant activo");
    }, 5000);
    return () => clearTimeout(timer);
  }, [hydrated, tid]);

  const effectiveTenantId = useMemo(() => {
    if (tid) return tid;
    return DEV_FALLBACK_TENANT;
  }, [tid]);

  const tenantError = !effectiveTenantId && hydrated ? timeoutError : null;

  return {
    effectiveTenantId,
    tenantHydrated: hydrated,
    tenantError,
  };
}

export function useLegalHealth(tenantId: string | undefined) {
  const [data, setData] = useState<LegalHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await legalApiClient.getHealth(tenantId);
      if (mounted.current) setData(r);
    } catch (e: unknown) {
      const msg = (e as LegalApiError)?.message || "Error de salud Legal";
      if (mounted.current) {
        setError(msg);
        setData(null);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useLegalAgents(tenantId: string | undefined) {
  const [agents, setAgents] = useState<LegalAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await legalApiClient.getAgents(tenantId);
      if (mounted.current) setAgents(r.agents ?? []);
    } catch (e: unknown) {
      const msg = (e as LegalApiError)?.message || "Error al cargar agentes";
      if (mounted.current) {
        setError(msg);
        setAgents([]);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  return { agents, loading, error, refetch };
}

export function useLegalAuditTrail(
  tenantId: string | undefined,
  agent_id?: string,
  limit?: number,
  status?: string
) {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await legalApiClient.getAuditTrail(tenantId, { agent_id, limit, status });
      if (mounted.current) setEntries(r.entries ?? []);
    } catch (e: unknown) {
      const msg = (e as LegalApiError)?.message || "Error al cargar auditoría";
      if (mounted.current) {
        setError(msg);
        setEntries([]);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [tenantId, agent_id, limit, status]);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  return { entries, loading, error, refetch };
}

export function useKnowledgePackStatus(tenantId: string | undefined) {
  const [data, setData] = useState<KnowledgePackStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    if (!tenantId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await legalApiClient.getKnowledgePackStatus(tenantId);
      if (mounted.current) setData(r);
    } catch (e: unknown) {
      const msg = (e as LegalApiError)?.message || "Error knowledge pack";
      if (mounted.current) {
        setError(msg);
        setData(null);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useLegalAgentRun(tenantId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (agentId: string, inputs: Record<string, unknown>): Promise<AgentRunResponse> => {
      if (!tenantId) throw new Error("Tenant no disponible");
      setLoading(true);
      setError(null);
      try {
        return await legalApiClient.runAgent(tenantId, agentId, inputs);
      } catch (e: unknown) {
        const err = e as LegalApiError;
        setError(err?.message || "Error en ejecución");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  return { run, loading, error, clearError: () => setError(null) };
}
