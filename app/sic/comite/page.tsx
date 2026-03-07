"use client";

import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

const MODULOS = [
  { href: "/sic/comite/sesiones", label: "Sesiones de comité", desc: "Listado y detalle de sesiones" },
];

export default function SicComitePage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Comité de Crédito</h1>
      <p className="text-slate-500 text-sm mb-6">
        Sistema de comité. Tenant: {tenant}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULOS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="block rounded-lg border border-slate-700/50 bg-slate-900/50 p-5 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-slate-100 font-600 text-base m-0 mb-1">{m.label}</h2>
            <p className="text-slate-500 text-xs m-0">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
