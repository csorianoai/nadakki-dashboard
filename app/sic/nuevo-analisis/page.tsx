"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SicNuevoAnalisisPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const { tenantId: authTenantId } = useAuth();
  const resolvedTenant =
    (tenantId && tenantId.trim()) || (authTenantId && authTenantId.trim()) || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNuevoAnalisis = async () => {
    if (!resolvedTenant) {
      setError("No hay tenant activo");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/sic/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": resolvedTenant,
        },
        body: JSON.stringify({
          applicant_id: `applicant-${Date.now()}`,
          title: "Nuevo Análisis",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const errDetail =
          (typeof data?.detail === "string" && data.detail) ||
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          `Error ${res.status}`;
        setError(errDetail);
        return;
      }
      const inner =
        data?.data && typeof data.data === "object" && !Array.isArray(data.data)
          ? (data.data as Record<string, unknown>)
          : data;
      const caseId = inner?.id ?? data?.id;
      if (typeof caseId === "string" && caseId.trim()) {
        router.push(`/sic/expedientes/${encodeURIComponent(caseId)}`);
        return;
      }
      setError("El servidor no retornó un ID de expediente");
    } catch (err) {
      console.error("Create case failed:", err);
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-2">Nuevo análisis</h1>
      <p className="text-slate-500 text-sm mb-6 max-w-xl">
        Crea un expediente en el sistema y sube el estado de cuenta u otros documentos desde la vista del caso.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300 max-w-xl">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleNuevoAnalisis}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-600 text-white hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? "Creando expediente…" : "Subir Estado de Cuenta"}
        </button>
        <Link
          href="/sic/expedientes"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 inline-flex items-center"
        >
          Ver expedientes
        </Link>
        <Link
          href="/sic/bandeja"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 inline-flex items-center"
        >
          Bandeja
        </Link>
        <Link
          href="/sic"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 inline-flex items-center"
        >
          Inicio SIC
        </Link>
      </div>
    </div>
  );
}
