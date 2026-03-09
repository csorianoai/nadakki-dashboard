"use client";

import { useDemo } from "@/contexts/DemoContext";
import Link from "next/link";

const PASOS: { titulo: string; desc: string; href: string }[] = [
  { titulo: "Bandeja", desc: "Expedientes recibidos para análisis", href: "/sic/bandeja" },
  { titulo: "Expediente", desc: "Vista integral con decisión y evidencia", href: "/sic/expedientes" },
  { titulo: "Decisión IA", desc: "Recomendación y confianza del modelo", href: "/sic/expedientes" },
  { titulo: "Override", desc: "Decisión final humana y justificación", href: "/sic/expedientes" },
  { titulo: "Comité", desc: "Sesiones y votación colegiada", href: "/sic/comite/sesiones" },
  { titulo: "Portafolio", desc: "Analítica y métricas de riesgo", href: "/sic/portafolio" },
  { titulo: "Exportación", desc: "PDF, ZIP y paquete regulatorio", href: "/sic/exportaciones" },
  { titulo: "Auditoría", desc: "Trazabilidad y cumplimiento", href: "/sic/auditoria" },
];

export function TourGuiadoInstitucional() {
  const { tourActivo, cerrarTour } = useDemo();

  if (!tourActivo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 max-w-lg rounded-lg border border-slate-600 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-200 font-700 text-sm">Recorrido institucional</h2>
          <button
            type="button"
            onClick={cerrarTour}
            className="text-slate-500 hover:text-slate-300 text-lg"
          >
            ×
          </button>
        </div>
        <p className="text-slate-400 text-xs mb-4">
          Navegue por cada módulo para conocer la plataforma SIC.
        </p>
        <ul className="space-y-2">
          {PASOS.map((p, i) => (
            <li key={i}>
              <Link
                href={p.href}
                onClick={cerrarTour}
                className="block rounded border border-slate-700 bg-slate-800/80 px-4 py-3 hover:border-cyan-500/50 hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-200 font-600 text-sm">{i + 1}. {p.titulo}</span>
                <p className="text-slate-500 text-xs mt-0.5">{p.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={cerrarTour}
            className="rounded px-4 py-2 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600"
          >
            Cerrar recorrido
          </button>
        </div>
      </div>
    </div>
  );
}
