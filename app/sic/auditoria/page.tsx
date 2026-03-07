"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

export default function SicAuditoriaPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Panel de Auditoría</h1>
      <p className="text-slate-500 text-sm mb-6">Eventos de auditoría por expediente</p>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
        <p className="text-slate-400 text-sm mb-4">
          La auditoría se visualiza dentro de cada expediente.
        </p>
        <Link href="/sic/expedientes" className="text-cyan-400 hover:underline text-sm">
          Abrir expedientes
        </Link>
      </div>
    </div>
  );
}
