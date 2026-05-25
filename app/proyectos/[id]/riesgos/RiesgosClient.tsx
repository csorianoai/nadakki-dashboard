"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "@/lib/motion-stub";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { Button, Input, Modal, Select, Textarea } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import { getRiesgos } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray, coerceNumber } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import {
  createProyectoRiesgo,
  ProjectsCoreMutationError,
} from "@/components/proyectos/projectsCoreMutationClient";

const HEAT = ["rgba(251,113,133,0.15)", "rgba(251,191,36,0.3)", "rgba(245,158,11,0.55)", "rgba(220,38,38,0.55)"];

/** Matriz probabilidad × impacto 5×5 con riesgos reales dispersos cuando API entrega campo. */
function heatmapDots(rows: Record<string, unknown>[]) {
  return rows.slice(0, 18).map((row, idx) => {
    const impact = coerceNumber(row.impact ?? row.severity_impact ?? row.impacto, (idx % 4) + 2);
    const prob = coerceNumber(row.probability ?? row.probability_score ?? row.probabilidad, (idx % 3) + 2);
    const label = String(row.title ?? row.name ?? row.titulo ?? row.risk_id ?? row.id ?? `R-${idx}`);
    const pi = Math.min(5, Math.max(1, Math.round(impact)));
    const pj = Math.min(5, Math.max(1, Math.round(prob)));
    return { pi, pj, label: label.length > 20 ? `${label.slice(0, 19)}…` : label, idx };
  });
}

function riskTitle(row: Record<string, unknown>, idx: number): string {
  return String(row.title ?? row.titulo ?? row.name ?? row.code ?? `R-${idx + 1}`);
}

const SCORE_OPTS = ["1", "2", "3", "4", "5"].map((n) => ({
  value: n,
  label: `${n} · ${Number(n) >= 4 ? "Alto++" : Number(n) === 3 ? "Medio" : "Bajo"}`,
}));

export function RiesgosClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [probabilidad, setProbabilidad] = useState("3");
  const [impacto, setImpacto] = useState("3");

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getRiesgos(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar riesgos"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const risks = useMemo(() => asObjectArray(data), [data]);
  const dots = useMemo(() => heatmapDots(risks), [risks]);

  const grid = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => ({
      pi: r + 1,
      pj: c + 1,
      severity: HEAT[(r + c) % HEAT.length],
      hits: dots.filter((d) => d.pi === r + 1 && d.pj === c + 1),
    })),
  );

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setProbabilidad("3");
    setImpacto("3");
  };

  const submitRiesgo = async () => {
    if (!tid) {
      toast.error("Sin tenant para mutar");
      return;
    }
    const t = titulo.trim();
    if (!t) {
      toast.warning("Titula el riesgo");
      return;
    }
    const desc = descripcion.trim();
    if (!desc) {
      toast.warning("Describe el escenario adverso");
      return;
    }

    const p = Number(probabilidad);
    const i = Number(impacto);
    if (!Number.isFinite(p) || p < 1 || p > 5 || !Number.isFinite(i) || i < 1 || i > 5) {
      toast.warning("Impacto/probabilidad deben estar entre 1 y 5");
      return;
    }

    const payload: Record<string, unknown> = {
      titulo: t,
      descripcion: desc,
      probabilidad: p,
      impacto: i,
    };

    setSaving(true);
    try {
      await createProyectoRiesgo(tid, proyectoId, payload);
      toast.success("Riesgo registrado", { description: t });
      setModalOpen(false);
      resetForm();
      await load();
    } catch (e) {
      const msg =
        e instanceof ProjectsCoreMutationError ? e.message : e instanceof Error ? e.message : "Error al crear riesgo";
      toast.error("No se registró el riesgo", { description: msg.slice(0, 220) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-8">
      <Link
        href={`/proyectos/${encodeURIComponent(proyectoId)}`}
        className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white"
      >
        ← Detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex flex-wrap items-start justify-between gap-4 border border-rose-500/25 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <AlertTriangle className="h-10 w-10 text-rose-300" />
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de riesgos</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Heatmap probabilidad ↑ · impacto → — proyecto {proyectoId}. Edición señalizada hasta contar con endpoint PATCH/PUT.
              </p>
            </div>
          </div>
          <Button type="button" variant="primary" className="min-h-11 gap-2 shadow-lg shadow-rose-500/15" onClick={() => setModalOpen(true)}>
            <PlusCircle className="h-4 w-4" aria-hidden />
            Añadir riesgo
          </Button>
        </GlassCard>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        closeOnBackdropClick={!saving}
        title="Registrar riesgo"
        description="Mapeamos probabilidad × impacto con escala Likert 1-5 esperada por el core."
        className="!border-rose-400/35 !bg-zinc-950 !text-zinc-100 backdrop:!bg-black/80"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" loading={saving} onClick={() => void submitRiesgo()}>
              Guardar riesgo
            </Button>
          </div>
        }
      >
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Input label="Titular / código corto" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea
            label="Descripción contextual"
            required
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Probabilidad" value={probabilidad} onChange={(e) => setProbabilidad(e.target.value)} options={SCORE_OPTS} />
            <Select label="Impacto" value={impacto} onChange={(e) => setImpacto(e.target.value)} options={SCORE_OPTS} />
          </div>
        </div>
      </Modal>

      <GlassCard hover={false} className="overflow-hidden border border-white/15 p-5">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BP_ACCENTS.glow }}>
          Matriz viva · riesgos proyectados
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {grid.flatMap((row) =>
            row.map((cell, i) => (
              <div
                key={`${cell.pi}-${cell.pj}-${i}`}
                className="relative flex min-h-[72px] flex-col rounded-xl border border-white/10 p-2 text-[9px]"
                style={{ backgroundColor: cell.severity }}
              >
                <span className="text-[8px] font-mono uppercase text-zinc-300">
                  I{cell.pi}×P{cell.pj}
                </span>
                <div className="mt-auto space-y-0.5 overflow-hidden">
                  {cell.hits.map((h) => (
                    <div key={`${h.idx}`} className="truncate rounded bg-black/55 px-1 py-[1px] text-[8px] text-amber-100">
                      {h.label}
                    </div>
                  ))}
                </div>
              </div>
            )),
          )}
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-0">
        {!loading && !error && risks.length > 0 ? (
          <>
            <div className="border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.16em]" style={{ color: BP_ACCENTS.glow }}>
              Tabla riesgos
            </div>
            <div className="max-h-[360px] overflow-auto p-5">
              <table className="w-full text-left text-xs text-zinc-200">
                <thead className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  <tr>
                    <th className="py-2">Riesgo</th>
                    <th className="py-2">Prob.</th>
                    <th className="py-2">Impacto</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.slice(0, 25).map((r, idx) => (
                    <tr key={idx} className="border-t border-white/5">
                      <td className="py-2 pr-2 font-semibold text-white">{riskTitle(r, idx)}</td>
                      <td className="py-2 font-mono text-amber-200">
                        {coerceNumber(r.probability ?? r.probability_score ?? r.probabilidad, idx % 5)}
                      </td>
                      <td className="py-2 font-mono text-rose-100">{coerceNumber(r.impact ?? r.severity_impact ?? r.impacto, idx % 5)}</td>
                      <td className="py-2 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-8 px-3 text-[10px] opacity-60"
                          disabled
                          title="Edición pendiente de contrato PATCH/PUT Riesgos"
                        >
                          Editar · próximamente
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </GlassCard>

      <ProyectosDataViewer
        title="Payload riesgos (JSON técnico)"
        subtitle={`GET /api/v1/proyectos/{id}/riesgos`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
