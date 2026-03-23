"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";
import { useDemo } from "@/contexts/DemoContext";
import { fetchExpedientes, type Expediente } from "@/lib/api/sic";
import { getDemoExpedientes } from "@/lib/demo-sic";

function pickNewest(list: Expediente[]): Expediente | null {
  if (!list.length) return null;
  return [...list].sort((a, b) => {
    const ta = new Date(a.fecha_actualizacion ?? a.fecha_creacion ?? 0).getTime();
    const tb = new Date(b.fecha_actualizacion ?? b.fecha_creacion ?? 0).getTime();
    return tb - ta;
  })[0];
}

export default function SicNuevoAnalisisPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const { demoMode, escenario } = useDemo();
  const tenant = tenantId || "credicefi";
  const [phase, setPhase] = useState<"loading" | "empty">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const expedientes = demoMode
          ? getDemoExpedientes(escenario)
          : await fetchExpedientes(tenant);
        if (!alive) return;
        const newest = pickNewest(expedientes);
        if (!newest) {
          setPhase("empty");
          return;
        }
        router.replace(`/sic/expedientes/${newest.expediente_id}`);
      } catch {
        if (alive) setPhase("empty");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tenant, demoMode, escenario, router]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Abriendo carga de documentos…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-2">Nuevo análisis</h1>
      <p className="text-slate-500 text-sm mb-6 max-w-xl">
        No hay expedientes disponibles para adjuntar documentos. Cuando exista al menos un expediente, este acceso lo llevará directo al panel de carga (estado de cuenta / PDF).
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/sic/expedientes"
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-600 text-white hover:bg-cyan-500"
        >
          Ver expedientes
        </Link>
        <Link
          href="/sic/bandeja"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Bandeja
        </Link>
        <Link href="/sic" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
          Inicio SIC
        </Link>
      </div>
    </div>
  );
}
