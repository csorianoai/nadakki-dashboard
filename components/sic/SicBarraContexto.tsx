"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";

const MODO = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SIC_MODE
  ? process.env.NEXT_PUBLIC_SIC_MODE
  : process.env.NODE_ENV === "production"
  ? "prod"
  : "sandbox";

const MODO_BADGE: Record<string, string> = {
  prod: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  sandbox: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  demo: "bg-violet-500/20 text-violet-400 border-violet-500/40",
};

export function SicBarraContexto() {
  const { isAuthenticated, role, tenantName } = useAuth();
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const displayTenant = tenantName && tenantName !== "—" ? tenantName : tenant;

  if (!isAuthenticated) return null;

  return (
    <div className="border-b border-slate-700/60 bg-slate-900/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-slate-500">Usuario:</span>
        <span className="text-slate-300 font-medium">{role ?? "—"}</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Rol:</span>
        <span className="text-slate-300">{role ?? "—"}</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Tenant:</span>
        <span className="text-slate-300 font-mono">{displayTenant}</span>
        <span className="text-slate-600">|</span>
        <span className={`px-2 py-0.5 rounded border ${MODO_BADGE[MODO] ?? "bg-slate-600/30 text-slate-400"}`}>
          {MODO}
        </span>
      </div>
      <nav className="flex items-center gap-2">
        <Link href="/sic" className="text-slate-500 hover:text-slate-300">Inicio</Link>
        <span className="text-slate-600">·</span>
        <Link href="/sic/bandeja" className="text-slate-500 hover:text-slate-300">Bandeja</Link>
        <span className="text-slate-600">·</span>
        <Link href="/sic/expedientes" className="text-slate-500 hover:text-slate-300">Expedientes</Link>
        <span className="text-slate-600">·</span>
        <Link href="/sic/exportaciones" className="text-slate-500 hover:text-slate-300">Exportaciones</Link>
        <span className="text-slate-600">·</span>
        <Link href="/sic/auditoria" className="text-slate-500 hover:text-slate-300">Auditoría</Link>
      </nav>
    </div>
  );
}
