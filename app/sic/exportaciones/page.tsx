"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchExpedientes } from "@/lib/api/sic";
import Link from "next/link";

export default function SicExportacionesPage() {
  const { tenantId } = useTenant();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenant = tenantId || "credicefi";

  useEffect(() => {
    let alive = true;
    fetchExpedientes(tenant)
      .then((list) => { if (alive) setCount(list.length); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Centro de Exportaciones</h1>
      <p className="text-slate-500 text-sm mb-6">Generar PDF, ZIP y reportes de expedientes</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
        <p className="text-slate-400 text-sm mb-4">
          Las exportaciones se generan desde la vista integral del expediente.
        </p>
        <p className="text-slate-500 text-xs mb-4">
          {count} expediente(s) disponible(s) para exportar.
        </p>
        <Link href="/sic/expedientes" className="text-cyan-400 hover:underline text-sm">
          Ir a Expedientes
        </Link>
      </div>
    </div>
  );
}
