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
  { href: "/sic/demo", label: "Modo Demo", desc: "Presentaciones con datos simulados" },
];

const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-700 text-white shadow-lg shadow-violet-950/40 transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-600 text-zinc-200 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";

export default function SicPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-800 text-zinc-100 m-0 mb-1">SIC — Sistema de Información Crediticia</h1>
      <p className="text-zinc-500 text-sm mb-4">
        Plataforma operativa de riesgo crediticio. Tenant: {tenant}
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/sic/nuevo-analisis" className={BTN_PRIMARY}>
          Nuevo Análisis
        </Link>
        <Link href="/sic/nuevo-analisis" className={BTN_SECONDARY}>
          Subir Estado de Cuenta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULOS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-violet-500/40 hover:bg-zinc-800/50 transition-colors"
          >
            <h2 className="text-zinc-100 font-600 text-base m-0 mb-1">{m.label}</h2>
            <p className="text-zinc-500 text-xs m-0">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-sm font-600 text-zinc-300 mb-2">Acceso rápido</h3>
        <p className="text-zinc-500 text-sm mb-4">
          Vista integral, Decision Replay y Memo Ejecutivo disponibles en cada expediente.
        </p>
        <div className="flex gap-2">
          <Link href="/sic/expedientes" className="text-violet-400 hover:underline text-sm">
            Expedientes
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/sic/portafolio" className="text-violet-400 hover:underline text-sm">
            Portafolio
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/sic/reportes" className="text-violet-400 hover:underline text-sm">
            Reportes
          </Link>
        </div>
      </div>
    </div>
  );
}
