"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  legalApi,
  type LegalQuickCheckResponse,
  type QuickCheckRequest,
  type AuditEntry,
  type KnowledgePackInfo,
  getLegalApiErrorMessage,
} from "@/lib/legal-api";

export function useLegalQuickCheck() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LegalQuickCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (payload: QuickCheckRequest) => {
      const tid = tenantId?.trim();
      if (!tid) {
        const msg = "Selecciona un tenant para usar Legal Core.";
        setError(msg);
        throw new Error(msg);
      }
      setLoading(true);
      setError(null);
      try {
        const r = await legalApi.quickCheck(payload, tid);
        setResult(r);
        return r;
      } catch (e: unknown) {
        const msg = getLegalApiErrorMessage(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, submit, reset, tenantMissing: !tenantId?.trim() };
}

export function useAuditLog(limite = 50) {
  const { tenantId } = useTenant();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const tid = tenantId?.trim();
    if (!tid) {
      setEntries([]);
      setError("Selecciona un tenant para cargar el audit log.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await legalApi.getAuditLog(limite, tid);
      setEntries(data.ejecuciones ?? []);
    } catch (e: unknown) {
      setError(getLegalApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [limite, tenantId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { entries, loading, error, refetch };
}

export function useKnowledgePackInfo(jurisdiccion: string = "do") {
  const { tenantId } = useTenant();
  const [info, setInfo] = useState<KnowledgePackInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = tenantId?.trim();
    if (!tid) {
      setInfo(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    legalApi
      .getKnowledgePackInfo(jurisdiccion, tid)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [jurisdiccion, tenantId]);

  return { info, loading };
}

export {
  useLegalEffectiveTenantId,
  useLegalHealth,
  useLegalAgents,
  useLegalAuditTrail,
  useKnowledgePackStatus,
  useLegalAgentRun,
} from "./useLegalCore";
