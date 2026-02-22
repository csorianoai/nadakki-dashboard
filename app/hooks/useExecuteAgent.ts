import { useState, useCallback } from "react";
import { resolveExecutableAgentId } from "@/lib/api/agents";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

interface ExecuteResult {
  success: boolean;
  agent_id: string;
  dry_run: boolean;
  result: Record<string, any>;
  timestamp: string;
}

interface UseExecuteAgentReturn {
  execute: (
    agentId: string,
    payload?: Record<string, any>,
    dryRun?: boolean,
    tenantId?: string
  ) => Promise<void>;
  result: ExecuteResult | null;
  loading: boolean;
  error: string | null;
  clear: () => void;
}

export function useExecuteAgent(): UseExecuteAgentReturn {
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    agentId: string,
    payload: Record<string, any> = {},
    dryRun: boolean = true,
    tenantId?: string | null
  ) => {
    if (!tenantId) {
      setError("Selecciona un tenant para ejecutar");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const resolvedId = await resolveExecutableAgentId(agentId, tenantId);
      const bodyPayload = { ...payload, tenant_id: tenantId };

      const response = await fetch(`${API_URL}/api/v1/agents/${resolvedId}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
          "X-Role": process.env.NEXT_PUBLIC_DEV_ROLE || "user",
        },
        body: JSON.stringify({
          payload: bodyPayload,
          dry_run: dryRun,
          live: !dryRun,
          auto_publish: false,
          auto_email: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error ejecutando agente");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { execute, result, loading, error, clear };
}

