"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

const MODULOS = [
  { href: "/sic/metricas", label: "Métricas", desc: "Panel ejecutivo de rendimiento" },
  { href: "/sic/bandeja", label: "Bandeja", desc: "Expedientes recibidos para análisis" },
  { href: "/sic/expedientes", label: "Expedientes", desc: "Listado y vista integral" },
  { href: "/sic/comite/sesiones", label: "Comité", desc: "Sesiones y votación" },
  { href: "/sic/portafolio", label: "Portafolio", desc: "Analítica de riesgo" },
  { href: "/sic/reportes", label: "Reportes", desc: "Dashboard ejecutivo" },
  { href: "/sic/exportaciones", label: "Exportaciones", desc: "PDF, ZIP y paquete regulatorio" },
  { href: "/sic/auditoria", label: "Auditoría", desc: "Eventos y trazabilidad" },
  { href: "/sic/configuracion", label: "Configuración", desc: "Parámetros SIC" },
];

export default function SicPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-2xl font-800 text-slate-100 m-0 mb-1">SIC — Sistema de Información Crediticia</h1>
      <p className="text-slate-500 text-sm mb-6">
        Plataforma operativa de riesgo crediticio. Tenant: {tenant}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULOS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="block rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-slate-100 font-600 text-base m-0 mb-1">{m.label}</h2>
            <p className="text-slate-500 text-xs m-0">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
        <h3 className="text-sm font-600 text-slate-300 mb-2">Acceso rápido</h3>
        <p className="text-slate-500 text-sm mb-4">
          Vista integral, Decision Replay y Memo Ejecutivo disponibles en cada expediente.
        </p>
        <div className="flex gap-2">
          <Link href="/sic/expedientes" className="text-cyan-400 hover:underline text-sm">Expedientes</Link>
          <span className="text-slate-600">·</span>
          <Link href="/sic/portafolio" className="text-cyan-400 hover:underline text-sm">Portafolio</Link>
          <span className="text-slate-600">·</span>
          <Link href="/sic/reportes" className="text-cyan-400 hover:underline text-sm">Reportes</Link>
        </div>
      </div>
    </div>
  );
}
