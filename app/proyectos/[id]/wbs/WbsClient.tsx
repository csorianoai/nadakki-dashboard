"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "@/lib/motion-stub";
import { Layers, PlusCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button, Input, Modal, Textarea } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import { getWbs } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray, coerceNumber } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import {
  createWbsItem,
  ProjectsCoreMutationError,
} from "@/components/proyectos/projectsCoreMutationClient";

/** Mini-plan por fases — duración modelo si API no tipa duración literal. */
function ganttFromWbs(rows: Record<string, unknown>[]) {
  return rows.slice(0, 12).map((row, idx) => {
    const title = String(row.name ?? row.phase ?? row.label ?? row.title ?? row.nombre ?? `Hito ${idx + 1}`);
    const dur = coerceNumber(row.duration_days ?? row.duracion_dias ?? row.estimate_hours ?? row.hours ?? row.weight, (idx % 6) + 4);
    return { fase: title.length > 16 ? `${title.slice(0, 15)}…` : title, dias: dur };
  });
}

function taskLabel(row: Record<string, unknown>, idx: number): string {
  return String(row.nombre ?? row.name ?? row.title ?? row.label ?? `Tarea ${idx + 1}`);
}

export function WbsClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fase, setFase] = useState("");
  const [duracion, setDuracion] = useState("7");

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getWbs(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar WBS"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => asObjectArray(data), [data]);
  const ganttRows = useMemo(() => {
    const g = ganttFromWbs(rows);
    return g.length ? g : [{ fase: "Plan base", dias: 7 }];
  }, [rows]);

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setFase("");
    setDuracion("7");
  };

  const submitWbs = async () => {
    if (!tid) {
      toast.error("Sin tenant para mutar");
      return;
    }
    const trimmed = nombre.trim();
    if (!trimmed) {
      toast.warning("Nombre obligatorio");
      return;
    }
    const payload: Record<string, unknown> = { nombre: trimmed };
    const desc = descripcion.trim();
    if (desc) payload.descripcion = desc;
    const ph = fase.trim();
    if (ph) payload.fase = ph;
    const d = duracion.trim();
    if (d !== "") {
      const n = Number(d);
      if (Number.isFinite(n) && n >= 0) payload.duracion_dias = Math.round(n);
    }

    setSaving(true);
    try {
      await createWbsItem(tid, proyectoId, payload);
      toast.success("Tarea WBS registrada", { description: trimmed });
      setModalOpen(false);
      resetForm();
      await load();
    } catch (e) {
      const msg =
        e instanceof ProjectsCoreMutationError ? e.message : e instanceof Error ? e.message : "Error al crear";
      toast.error("No se pudo crear la tarea", { description: msg.slice(0, 220) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-8">
      <Link
        href={`/proyectos/${encodeURIComponent(proyectoId)}`}
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:text-white"
      >
        ← Workspace · detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Layers className="h-9 w-9 text-amber-300" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
                  WBS blueprint
                </p>
                <h1 className="text-2xl font-bold text-white">Desglose de trabajo</h1>
                <p className="text-sm text-zinc-400">{`Proyecto ${proyectoId}`}</p>
              </div>
            </div>
            <Button type="button" variant="primary" className="min-h-11 gap-2 shadow-lg shadow-amber-500/20" onClick={() => setModalOpen(true)}>
              <PlusCircle className="h-4 w-4" aria-hidden />
              Añadir tarea
            </Button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Alta con POST viviente contra <span className="font-mono text-amber-200/90">/wbs</span> — payloads snake_case español habitual del core hasta YAML en repo.
            La edición queda señalizada en tabla hasta versionar endpoint PATCH/PUT para tareas.
          </p>
        </GlassCard>
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        closeOnBackdropClick={!saving}
        title="Nueva tarea WBS"
        description="Nombre obligatorio · fases y duración opcionales (no bloqueamos avance)."
        className="!border-amber-400/35 !bg-zinc-950 !text-zinc-100 backdrop:!bg-black/80"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" loading={saving} onClick={() => void submitWbs()}>
              Guardar tarea
            </Button>
          </div>
        }
      >
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Input label="Nombre de la tarea" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Textarea label="Descripción (opcional)" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <Input label="Fase / capítulo (opcional)" value={fase} onChange={(e) => setFase(e.target.value)} />
          <Input
            label="Duración estimada (días)"
            inputMode="numeric"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          />
        </div>
      </Modal>

      {!loading && !error && rows.length > 0 ? (
        <GlassCard hover={false} className="overflow-hidden border border-white/12 p-0">
          <div className="border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.16em]" style={{ color: BP_ACCENTS.glow }}>
            Tabla · tareas WBS vigentes
          </div>
          <div className="max-h-[320px] overflow-auto p-5">
            <table className="w-full text-left text-xs text-zinc-200">
              <thead className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                <tr>
                  <th className="py-2">Tarea</th>
                  <th className="py-2">Fase</th>
                  <th className="py-2 text-right">Días</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 40).map((r, idx) => {
                  const dRaw = r.duracion_dias ?? r.duration_days ?? r.estimate_hours;
                  const dias = coerceNumber(dRaw, NaN);
                  return (
                    <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/5">
                      <td className="py-2 font-semibold text-white">{taskLabel(r, idx)}</td>
                      <td className="py-2 text-zinc-400">{String(r.fase ?? r.phase ?? "—")}</td>
                      <td className="py-2 text-right font-mono text-amber-200">{Number.isFinite(dias) ? dias : "—"}</td>
                      <td className="py-2 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-8 px-3 text-[10px] opacity-60"
                          disabled
                          title="Edición pendiente de contrato PATCH/PUT WBS"
                        >
                          Editar · próximamente
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}

      <GlassCard hover={false} className="border border-white/12 p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BP_ACCENTS.glow }}>
          Ventana técnica (barras horizontales modelo)
        </h2>
        <div className="h-[min(360px,50vh)] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={ganttRows} margin={{ left: 56, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#71717a" />
              <YAxis type="category" dataKey="fase" width={120} stroke="#71717a" tick={{ fill: "#d4d4d8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(251,191,36,0.35)" }} />
              <Bar dataKey="dias" fill={BP_ACCENTS.primary} radius={[0, 8, 8, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <ProyectosDataViewer
        title="Payload técnico WBS"
        subtitle={`GET /api/v1/proyectos/{id}/wbs`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
