"use client";

import { useDemo, ESCENARIOS } from "@/contexts/DemoContext";
import Link from "next/link";

export default function SicDemoPage() {
  const { demoMode, setDemoMode, escenario, setEscenario, iniciarTour } = useDemo();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Modo Demo Institucional</h1>
      <p className="text-slate-500 text-sm mb-6">Presentaciones comerciales con datos simulados</p>

      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
        <section>
          <h2 className="text-slate-300 font-600 text-sm mb-3">Estado</h2>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`rounded px-4 py-2 text-sm font-medium ${
              demoMode ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-400"
            }`}
          >
            Modo Demo: {demoMode ? "Activado" : "Desactivado"}
          </button>
          {demoMode && (
            <span className="ml-3 px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-xs">
              DEMO INSTITUCIONAL
            </span>
          )}
        </section>

        <section>
          <h2 className="text-slate-300 font-600 text-sm mb-3">Escenario preconfigurado</h2>
          <div className="grid grid-cols-1 gap-2">
            {ESCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setEscenario(s.id)}
                className={`rounded border px-4 py-3 text-left ${
                  escenario === s.id
                    ? "border-cyan-500/60 bg-cyan-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <span className="text-slate-200 font-medium text-sm">{s.label}</span>
                <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-slate-300 font-600 text-sm mb-3">Recorrido guiado</h2>
          <button
            type="button"
            onClick={iniciarTour}
            className="rounded px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500"
          >
            Iniciar recorrido institucional
          </button>
          <p className="text-slate-500 text-xs mt-2">
            Muestra: Bandeja → Expediente → Decisión IA → Override → Comité → Portafolio → Exportación → Auditoría
          </p>
        </section>

        <div className="pt-4 border-t border-slate-700/50">
          <Link href="/sic" className="text-cyan-400 hover:underline text-sm">
            ← Volver a SIC
          </Link>
        </div>
      </div>
    </div>
  );
}
