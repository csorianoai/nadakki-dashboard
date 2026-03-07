"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

const ACCESOS = [
  { href: "/sic/portafolio", label: "Analítica de portafolio", desc: "KPIs, estados, riesgos" },
  { href: "/sic/exportaciones", label: "Exportaciones", desc: "PDF, ZIP, paquete regulatorio" },
  { href: "/sic/auditoria", label: "Auditoría", desc: "Trazabilidad y eventos" },
  { href: "/sic/comite/sesiones", label: "Sesiones de comité", desc: "Actividad de comité" },
];

export default function SicReportesPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Dashboard Ejecutivo SIC</h1>
      <p className="text-slate-500 text-sm mb-6">Reportes, analítica y métricas de flujo</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACCESOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="block rounded-lg border border-slate-700/50 bg-slate-900/50 p-5 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-slate-100 font-600 text-base m-0 mb-1">{a.label}</h2>
            <p className="text-slate-500 text-xs m-0">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
