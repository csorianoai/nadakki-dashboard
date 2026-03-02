"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";
import { tenantsAPI } from "@/lib/api/tenants";

export interface TenantOption {
  id: string;
  name: string;
}

function normalizeTenants(raw: unknown): TenantOption[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const nested = obj.data as Record<string, unknown> | undefined;
  const arr = (obj.tenants ?? nested?.tenants ?? obj.data ?? []) as unknown[];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => {
      const item = t as Record<string, unknown>;
      const id = String(item.tenant_id ?? item.id ?? item.slug ?? "");
      const name = String((item.name ?? item.tenant_id ?? id) || "—");
      return id ? { id, name } : null;
    })
    .filter((x): x is TenantOption => Boolean(x));
}

export default function TenantSelector() {
  const { tenantId, setTenantId } = useTenant();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantsAPI.getListForSelector();
      const list = normalizeTenants(res);
      setTenants(list);
    } catch {
      try {
        const fallback = await fetch("/api/tenants", { cache: "no-store" });
        const text = await fallback.text().catch(() => "");
        if (fallback.ok && text) {
          const json = JSON.parse(text);
          const list = normalizeTenants(json?.data ?? json);
          if (list.length > 0) {
            setTenants(list);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setTenants([]);
      setError("manual");
      if (process.env.NODE_ENV === "development") {
        console.debug("[TenantSelector] Tenants load failed; using Modo manual.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleChange = (value: string) => {
    if (!value) return;
    setTenantId(value);
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ fontSize: "11px", color: "#64748b" }}>Cargando tenant…</div>
    );
  }
  if (error === "manual") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Modo manual</span>
        <input
          type="text"
          placeholder="tenant_id"
          value={tenantId ?? ""}
          onChange={(e) => setTenantId(e.target.value)}
          style={{
            fontSize: "11px",
            padding: "4px 8px",
            width: "100px",
            borderRadius: "6px",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            color: "#94a3b8",
          }}
          title="Introduce el tenant (ej. credicefi)"
        />
      </div>
    );
  }

  return (
    <select
      value={tenantId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        fontSize: "11px",
        padding: "4px 8px",
        borderRadius: "6px",
        border: "1px solid rgba(51, 65, 85, 0.8)",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        color: "#94a3b8",
        cursor: "pointer",
        minWidth: "120px",
      }}
      title="Seleccionar tenant"
    >
      <option value="">— Seleccionar tenant —</option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
