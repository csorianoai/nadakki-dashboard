"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

export type AgentRecord = {
  id: string;
  name: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  domain?: string;
  readiness?: number;
  status?: "active" | "inactive" | "beta";
  platform?: string;
  [k: string]: any;
};

export type UseAgentsResult = {
  agents: AgentRecord[];
  loading: boolean;
  error: string | null;
  source: "api" | "local" | "empty";
  lastError?: string;
  refresh: () => Promise<void>;
};

const DEFAULT_LOCAL_URLS = [
  "/data/all-agents-structure.json",
  "/data/agents.json",
  "/data/agents.catalog.json",
];

const DEBUG = typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_AGENTS === "1";

function normalizeAgent(a: any, indexFallback?: number): AgentRecord {
  if (!a || typeof a !== "object") {
    return {
      id: `agent-invalid-${indexFallback ?? 0}`,
      name: "Invalid Agent",
      status: "inactive",
    };
  }

  const rawId = a?.id ?? a?.agent_id ?? a?.key ?? a?.slug ?? a?.name ?? "";
  const fallbackBase = (
    a?.name ??
    a?.title ??
    a?.label ??
    a?.agent_name ??
    `agent-${indexFallback ?? 0}`
  )
    .toString()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const id =
    String(rawId)
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || fallbackBase;

  const finalId = id.length > 0 ? id : `agent-${indexFallback ?? 0}`;
  const name = a?.name ?? a?.title ?? a?.label ?? a?.agent_name ?? finalId ?? "Unknown Agent";

  let tagsArr: string[] = [];
  if (Array.isArray(a?.tags)) {
    tagsArr = a.tags.filter((t: any) => typeof t === "string");
  } else if (Array.isArray(a?.capabilities)) {
    tagsArr = a.capabilities.filter((c: any) => typeof c === "string");
  } else if (typeof a?.tags === "string") {
    tagsArr = a.tags
      .split(/[,;|]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  let status: "active" | "inactive" | "beta" = "active";
  if (a?.status) {
    const s = String(a.status).toLowerCase();
    if (["active", "inactive", "beta"].includes(s)) {
      status = s as any;
    }
  }

  return {
    ...a,
    id: finalId,
    name: String(name).trim(),
    title: a?.title ?? String(name).trim(),
    description: a?.description ?? a?.desc ?? "",
    tags: tagsArr,
    category: a?.category ?? a?.core ?? a?.group ?? undefined,
    domain: a?.domain ?? undefined,
    readiness: typeof a?.readiness === "number" ? a.readiness : undefined,
    status,
    platform: a?.platform ?? undefined,
  };
}

function extractAgents(payload: any): AgentRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const candidates =
    payload?.agents ??
    payload?.data ??
    payload?.items ??
    payload?.results ??
    payload;

  if (Array.isArray(candidates)) {
    return candidates.map((a, idx) => normalizeAgent(a, idx));
  }

  const maybe: any[] = [];

  if (payload?.cores && Array.isArray(payload.cores)) {
    for (const c of payload.cores) {
      if (Array.isArray(c?.agents)) {
        maybe.push(...c.agents);
      }
      if (Array.isArray(c?.modules)) {
        for (const m of c.modules) {
          if (Array.isArray(m?.agents)) {
            maybe.push(...m.agents);
          }
        }
      }
    }
  }

  if (!maybe.length && candidates && typeof candidates === "object") {
    for (const [k, v] of Object.entries(candidates)) {
      if (v && typeof v === "object") {
        maybe.push({ id: k, ...(v as any) });
      }
    }
  }

  return maybe.map((a, idx) => normalizeAgent(a, idx));
}

async function fetchJson(
  url: string,
  timeoutMs = 8000
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (e: any) {
    const aborted = e?.name === "AbortError";
    const errorMsg = aborted
      ? `Timeout after ${timeoutMs}ms`
      : e instanceof Error
      ? e.message
      : String(e) ?? "Unknown error";
    return { success: false, error: errorMsg };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useAgents(): UseAgentsResult {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | undefined>();
  const [source, setSource] = useState<UseAgentsResult["source"]>("empty");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const apiCandidates = useMemo(() => {
    const relativeEndpoints = [
  "/api/v1/agents",  // ← agregar esta ruta
  "/api/agents",
  "/api/catalog",
  "/api/ai-studio/agents",
];
    if (!apiBase) {
      return relativeEndpoints;
    }
    return [
      ...relativeEndpoints.map((ep) => `${apiBase}${ep}`),
      ...relativeEndpoints,
    ];
  }, [apiBase]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastError(undefined);
    let finalLastError: string | undefined;

    if (DEBUG) console.debug("[useAgents] Phase 1: Trying API...", { candidates: apiCandidates });

    for (const url of apiCandidates) {
      const result = await fetchJson(url);
      if (result.success === true) {
        const list = extractAgents(result.data);
        if (list.length > 0) {
          if (DEBUG) console.debug("[useAgents] ✅ API success", { url, count: list.length });
          setAgents(list);
          setSource("api");
          setLoading(false);
          return;
        }
      } else if (result.success === false) {
        finalLastError = (result as { success: false; error: string }).error;
        if (DEBUG) console.debug("[useAgents] ❌ API failed", { url, error: result.error });
      }
    }

    if (DEBUG) console.debug("[useAgents] Phase 2: Trying local...");

    for (const url of DEFAULT_LOCAL_URLS) {
      const result = await fetchJson(url);
      if (result.success === true) {
        const list = extractAgents(result.data);
        if (list.length > 0) {
          if (DEBUG) console.debug("[useAgents] ✅ Local success", { url, count: list.length });
          setAgents(list);
          setSource("local");
          setLoading(false);
          return;
        }
      } else if (result.success === false) {
                if (DEBUG) console.debug("[useAgents] ❌ Local failed", { url, error: result.error });
      }
    }

    if (DEBUG) console.warn("[useAgents] ⚠️ All sources exhausted", { lastError: finalLastError });

    setAgents([]);
    setSource("empty");
    const errorMsg = finalLastError
      ? `Last error: ${finalLastError}`
      : "No agents source available (API and local fallback failed).";
    setError(errorMsg);
    setLastError(finalLastError);
    setLoading(false);
  }, [apiCandidates]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    agents,
    loading,
    error,
    source,
    lastError,
    refresh: load,
  };
}










