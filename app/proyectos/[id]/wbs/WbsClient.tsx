"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "@/lib/motion-stub";
import { Layers, PlusCircle, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button, Input, Modal, Textarea } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import { getWbs } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray, coerceNumber } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import { getAuthHeaders } from "@/lib/api/fetch-client";
import {
  createWbsItem,
  projectsCorePost,
  ProjectsCoreMutationError,
} from "@/components/proyectos/projectsCoreMutationClient";
import { proyectoApiSuffix } from "@/lib/projects/proyectoApiPaths";

const PROJECTS_BASE = "/api/v1/proyectos";

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

function taskId(row: Record<string, unknown>): string | null {
  const raw = row.id ?? row.tarea_id ?? row.task_id ?? row.wbs_task_id;
  return raw === null || raw === undefined || raw === "" ? null : String(raw);
}

function taskDescription(row: Record<string, unknown>): string {
  return String(row.descripcion ?? row.description ?? "");
}

function taskPhase(row: Record<string, unknown>): string {
  return String(row.fase ?? row.phase ?? "");
}

function taskDuration(row: Record<string, unknown>): string {
  const raw = row.duracion_dias ?? row.duration_days ?? row.estimate_hours;
  const value = coerceNumber(raw, NaN);
  return Number.isFinite(value) ? String(value) : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function countFromValue(value: unknown): number | null {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function wbsGenerationSummary(result: unknown): string {
  const envelope = asRecord(result);
  const metadata = asRecord(envelope?.metadata);
  const count =
    countFromValue(metadata?.tareas_generadas) ??
    countFromValue(metadata?.tareas_propuestas) ??
    countFromValue(metadata?.task_count) ??
    countFromValue(envelope?.tareas) ??
    countFromValue(envelope?.tasks) ??
    countFromValue(envelope?.wbs);

  if (count !== null) {
    return `El agente generó ${count} ${count === 1 ? "tarea" : "tareas"} para revisión.`;
  }

  return "WBS generado para revisión; se actualizó la lista de tareas.";
}

async function patchWbsTask(
  tenantId: string,
  proyectoId: string,
  tareaId: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const url = `${PROJECTS_BASE}${proyectoApiSuffix(proyectoId, "wbs", "tareas", tareaId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId.trim(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const textRaw = await res.text().catch(() => "");
  let body: unknown = null;
  try {
    body = textRaw ? JSON.parse(textRaw) : null;
  } catch {
    body = textRaw;
  }

  if (!res.ok) {
    const detail =
      typeof body === "string"
        ? body
        : body && typeof body === "object" && "detail" in body
          ? JSON.stringify((body as Record<string, unknown>).detail)
          : typeof body === "object"
            ? JSON.stringify(body)
            : res.statusText;
    throw new ProjectsCoreMutationError(`Projects PATCH ${res.status}: ${detail}`, res.status, body);
  }

  return body;
}

export function WbsClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ id: string; label: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fase, setFase] = useState("");
  const [duracion, setDuracion] = useState("7");
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editFase, setEditFase] = useState("");
  const [editDuracion, setEditDuracion] = useState("");

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

  const generateWbsWithIa = async () => {
    if (!tid) {
      toast.error("Sin tenant para generar WBS");
      return;
    }

    setGenerating(true);
    setGenerationSummary(null);
    try {
      const result = await projectsCorePost(tid, proyectoApiSuffix(proyectoId, "wbs"), {});
      const summary = wbsGenerationSummary(result);
      setGenerationSummary(summary);
      toast.success("WBS generado con IA", { description: summary });
      await load();
    } catch (e) {
      const msg =
        e instanceof ProjectsCoreMutationError ? e.message : e instanceof Error ? e.message : "Error al generar WBS";
      toast.error("No se pudo generar el WBS con IA", { description: msg.slice(0, 220) });
    } finally {
      setGenerating(false);
    }
  };

  const openEditTask = (row: Record<string, unknown>, idx: number) => {
    const id = taskId(row);
    if (!id) {
      toast.warning("Esta tarea no trae identificador editable");
      return;
    }
    setEditingTask({ id, label: taskLabel(row, idx) });
    setEditNombre(taskLabel(row, idx));
    setEditDescripcion(taskDescription(row));
    setEditFase(taskPhase(row));
    setEditDuracion(taskDuration(row));
  };

  const submitTaskUpdate = async () => {
    if (!tid) {
      toast.error("Sin tenant para actualizar WBS");
      return;
    }
    if (!editingTask) return;

    const trimmed = editNombre.trim();
    if (!trimmed) {
      toast.warning("Nombre obligatorio");
      return;
    }

    const payload: Record<string, unknown> = { nombre: trimmed };
    const desc = editDescripcion.trim();
    payload.descripcion = desc || null;
    const ph = editFase.trim();
    payload.fase = ph || null;
    const d = editDuracion.trim();
    if (d !== "") {
      const n = Number(d);
      if (!Number.isFinite(n) || n < 0) {
        toast.warning("Duración debe ser un número positivo");
        return;
      }
      payload.duracion_dias = Math.round(n);
    } else {
      payload.duracion_dias = null;
    }

    setUpdating(true);
    try {
      await patchWbsTask(tid, proyectoId, editingTask.id, payload);
      toast.success("Tarea WBS actualizada", { description: trimmed });
      setEditingTask(null);
      await load();
    } catch (e) {
      const msg =
        e instanceof ProjectsCoreMutationError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Error al actualizar tarea WBS";
      toast.error("No se pudo actualizar la tarea", { description: msg.slice(0, 220) });
    } finally {
      setUpdating(false);
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 gap-2"
                loading={generating}
                disabled={!tid || loading}
                onClick={() => void generateWbsWithIa()}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Generar WBS con IA
              </Button>
              <Button type="button" variant="primary" className="min-h-11 gap-2 shadow-lg shadow-amber-500/20" onClick={() => setModalOpen(true)}>
                <PlusCircle className="h-4 w-4" aria-hidden />
                Añadir tarea
              </Button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Alta manual y generación IA contra <span className="font-mono text-amber-200/90">/wbs</span>; edición conectada por
            tarea vía <span className="font-mono text-amber-200/90">PATCH /wbs/tareas/:id</span>.
          </p>
        </GlassCard>
      </motion.div>

      {generationSummary ? (
        <GlassCard hover={false} className="border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
          {generationSummary}
        </GlassCard>
      ) : null}

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

      <Modal
        open={!!editingTask}
        onClose={() => {
          if (!updating) setEditingTask(null);
        }}
        closeOnBackdropClick={!updating}
        title="Editar tarea WBS"
        description={editingTask ? `Actualizando ${editingTask.label}` : "Actualiza campos de la tarea WBS."}
        className="!border-amber-400/35 !bg-zinc-950 !text-zinc-100 backdrop:!bg-black/80"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" disabled={updating} onClick={() => setEditingTask(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" loading={updating} onClick={() => void submitTaskUpdate()}>
              Guardar cambios
            </Button>
          </div>
        }
      >
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Input label="Nombre de la tarea" required value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
          <Textarea
            label="Descripción (opcional)"
            rows={3}
            value={editDescripcion}
            onChange={(e) => setEditDescripcion(e.target.value)}
          />
          <Input label="Fase / capítulo (opcional)" value={editFase} onChange={(e) => setEditFase(e.target.value)} />
          <Input
            label="Duración estimada (días)"
            inputMode="numeric"
            value={editDuracion}
            onChange={(e) => setEditDuracion(e.target.value)}
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
                          className="min-h-8 px-3 text-[10px]"
                          title={taskId(r) ? "Editar tarea WBS" : "Esta tarea no trae identificador editable"}
                          disabled={!taskId(r)}
                          onClick={() => openEditTask(r, idx)}
                        >
                          Editar
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
        subtitle={`GET /api/v1/proyectos/${proyectoId}/wbs`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
