"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/hooks/useAuth";

export interface TenantModule {
  slug: string;
  label: string;
  description?: string;
  category?: "core" | "marketing" | "analytics" | "channels" | "platform" | string;
  enabled: boolean;
  config?: Record<string, unknown> | null;
  expires_at?: string | null;
  assigned_at?: string;
}

export interface TenantModulesResponse {
  tenant_id: string;
  plan: string;
  modules: TenantModule[];
}

function coerceTenantModulesResponse(json: unknown): TenantModulesResponse {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid tenant modules response");
  }
  const o = json as Record<string, unknown>;
  const tenant_id = String(o.tenant_id ?? "");
  const plan = String(o.plan ?? "unknown");
  const raw = o.modules;
  if (!Array.isArray(raw)) {
    return { tenant_id, plan, modules: [] };
  }
  if (raw.length > 0 && typeof raw[0] === "string") {
    return {
      tenant_id,
      plan,
      modules: (raw as string[]).map((slug) => ({
        slug,
        label: slug,
        enabled: true,
        assigned_at: "",
      })),
    };
  }
  const modules: TenantModule[] = raw.map((row: unknown) => {
    const m = row as Record<string, unknown>;
    const slug = String(m.slug ?? "");
    return {
      slug,
      label: typeof m.label === "string" && m.label.trim() ? m.label : slug,
      description: typeof m.description === "string" ? m.description : undefined,
      category: typeof m.category === "string" ? m.category : undefined,
      enabled: typeof m.enabled === "boolean" ? m.enabled : true,
      config: m.config && typeof m.config === "object" ? (m.config as Record<string, unknown>) : null,
      expires_at: typeof m.expires_at === "string" || m.expires_at === null ? (m.expires_at as string | null) : undefined,
      assigned_at: typeof m.assigned_at === "string" ? m.assigned_at : "",
    };
  });
  return { tenant_id, plan, modules };
}

async function fetchTenantModules(tenantId: string): Promise<TenantModulesResponse> {
  const res = await fetch(`/api/v1/tenants/${encodeURIComponent(tenantId)}/modules`, {
    headers: { "X-Tenant-ID": tenantId.trim() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tenant modules: ${res.status}`);
  }
  const json: unknown = await res.json();
  return coerceTenantModulesResponse(json);
}

export function useTenantModules() {
  const { tenantId } = useTenant();
  const { activeRole } = useAuth();
  const tid = tenantId?.trim() ?? "";
  const isSuperadmin = activeRole?.role_key === "platform_superadmin";

  const query = useQuery({
    queryKey: ["tenant-modules", tid],
    queryFn: () => fetchTenantModules(tid),
    enabled: tid.length > 0,
    staleTime: 60_000,
  });

  const modules = query.data?.modules ?? [];
  const enabledSlugs = new Set(modules.filter((m) => m.enabled).map((m) => m.slug));

  const hasModule = (slug: string) => isSuperadmin || enabledSlugs.has(slug);

  /** True if tenant has Credit Core (`credit` or legacy slug aliases). */
  const hasCreditHub = () =>
    hasModule("credit") || hasModule("credit_hub") || hasModule("forge_credit") || hasModule("forge_credit_hub");

  return {
    plan: query.data?.plan ?? "loading",
    modules,
    hasModule,
    hasCreditHub,
    isLoading: isSuperadmin ? false : !tid || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
