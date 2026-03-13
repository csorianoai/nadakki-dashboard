"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchEstadoSistema, type EstadoSistema } from "@/lib/api/sic";

const SALUD_STYLE: Record<string, string> = {
  ok: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  degradado: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  no_disponible: "bg-slate-500/20 text-slate-400 border-slate-500/40",
  error: "bg-red-500/20 text-red-400 border-red-500/40",
};

export function IndicadorEstadoSistema() {
  const { tenantId } = useTenant();
  const [estado, setEstado] = useState<EstadoSistema | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    fetchEstadoSistema(tenantId)
      .then(setEstado)
      .catch(() => setEstado({ salud: "no_disponible", conectividad: false }));
  }, [tenantId]);

  const salud = estado?.salud ?? (estado?.conectividad === false ? "no_disponible" : "ok");
  const label =
    salud === "ok" ? "Operativo"
    : salud === "degradado" ? "Degradado"
    : salud === "no_disponible" ? "No disponible"
    : "Error";

  return (
    <span
      className={`px-2 py-0.5 rounded border text-xs ${SALUD_STYLE[salud] ?? "bg-slate-600/30 text-slate-400"}`}
      title={estado?.eventos_criticos ? `Eventos críticos: ${estado.eventos_criticos}` : undefined}
    >
      {label}
      {estado?.alertas_seguridad && estado.alertas_seguridad > 0 && (
        <span className="ml-1 text-red-400">({estado.alertas_seguridad})</span>
      )}
    </span>
  );
}
