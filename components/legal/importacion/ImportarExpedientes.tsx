"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createCase, fetchCasesList, fetchDocuments, ingestDocument } from "@/lib/legal/cases/legal-cases-api";
import { planificar, type PlanImportacion } from "@/lib/legal/importacion/plan";
import { importar, type Deps, type Informe, type Progreso } from "@/lib/legal/importacion/ejecutar";
import { tamano } from "@/lib/legal/archivo-api";
import { useEspacio } from "@/components/legal/archivo/PlanYAlmacenamiento";
import { genioButton, genioCard, genioPrimary } from "@/components/legal/cases/estudio-genio/estilo";
import m from "@/messages/es/legal-importacion.json";

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** Conexión real con el backend. Las pruebas pasan la suya. */
export function depsReales(tenantId: string): Deps {
  return {
    existentes: async () => {
      const r = await fetchCasesList(tenantId, { size: 500 });
      return new Map(r.cases.map((c) => [c.title, c.case_id]));
    },
    documentosDe: async (caseId) => {
      const r = await fetchDocuments(tenantId, caseId);
      return new Set(r.documents.map((d) => String((d as { title?: string }).title ?? "")));
    },
    crearExpediente: async (titulo, cliente) => {
      const c = await createCase(tenantId, {
        case_type: "unknown", title: titulo, priority: "normal", initial_state: "INGESTION",
        description: `${m.descripcion} «${titulo}».`,
        initial_actors: [{ role: "cliente", is_primary: true, actor_kind: "persona_fisica", full_name: cliente,
          conflict_check_done: false, conflict_detected: false }],
      });
      return c.case_id;
    },
    subir: async (caseId, file, titulo) => {
      const fd = new FormData();
      fd.append("file", file, file.name);
      await ingestDocument(tenantId, caseId, fd, { title: titulo, direction: "incoming" });
    },
  };
}

/** Importa todos los expedientes de una carpeta: cada subcarpeta es un expediente con sus documentos. */
export function ImportarExpedientes({ tenantId, deps, onCerrar }: { tenantId: string; deps?: Deps; onCerrar?: () => void }) {
  const client = useQueryClient();
  const espacio = useEspacio(tenantId);
  const input = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<PlanImportacion | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState("");
  const corriendo = progreso !== null && informe === null;
  const libre = espacio.data?.libre_bytes;
  const noCabe = plan !== null && typeof libre === "number" && plan.bytes > libre;
  const omitidosPorMotivo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of plan?.omitidos ?? []) c[o.motivo] = (c[o.motivo] ?? 0) + 1;
    return c;
  }, [plan]);

  const elegir = (files: FileList | null) => {
    setInforme(null); setError(""); setProgreso(null);
    const p = planificar(Array.from(files ?? []));
    setPlan(p);
  };
  const empezar = async () => {
    if (!plan || plan.documentos === 0) return;
    setError(""); setProgreso({ hechos: 0, total: plan.documentos, actual: "" });
    try {
      const r = await importar(plan, deps ?? depsReales(tenantId), setProgreso);
      setInforme(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgreso(null);
    } finally {
      void client.invalidateQueries({ queryKey: ["legal_cases", tenantId] });
      void client.invalidateQueries({ queryKey: ["legal_archivo", tenantId] });
    }
  };

  return (
    <section aria-labelledby="importar-expedientes" className={`${genioCard} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id="importar-expedientes" className="font-display text-xl font-semibold">{m.titulo}</h2>
          <p className="mt-1 text-sm text-[#3B4558]">{m.ayuda}</p>
        </div>
        {onCerrar && !corriendo && <button type="button" className={genioButton} onClick={onCerrar}>{m.cerrar}</button>}
      </div>

      <input ref={input} type="file" multiple className="sr-only" aria-label={m.elegir} data-testid="importar-input"
        // @ts-expect-error: atributos de navegador para elegir una carpeta completa
        webkitdirectory="" directory=""
        onChange={(e) => elegir(e.target.files)} />
      {!corriendo && !informe && (
        <button type="button" className={genioPrimary} onClick={() => input.current?.click()}>{plan ? m.otraCarpeta : m.elegir}</button>
      )}

      {plan && !informe && (
        <div className="space-y-3 rounded-xl border border-[#E3E7EE] bg-[#F5F7FA] p-4">
          <p className="font-semibold">{fill(m.resumen, { expedientes: plan.grupos.length, documentos: plan.documentos, tamano: tamano(plan.bytes) })}</p>
          {typeof libre === "number" && <p className="text-sm text-[#3B4558]">{fill(m.libre, { libre: tamano(libre) })}</p>}
          {noCabe && (
            <p role="alert" className="text-sm font-medium text-[#8E2C3A]">
              {m.noCabe} <Link href="/legal/config#plan-almacenamiento" className="underline">{m.ampliar}</Link>
            </p>
          )}
          {plan.omitidos.length > 0 && (
            <p className="text-sm text-[#6B7385]">
              {fill(m.omitidos, { n: plan.omitidos.length })}{" "}
              {Object.entries(omitidosPorMotivo).map(([k, n]) => `${m.motivos[k as keyof typeof m.motivos]}: ${n}`).join(" · ")}
            </p>
          )}
          <ul className="max-h-56 divide-y divide-[#E3E7EE] overflow-auto rounded-lg border border-[#E3E7EE] bg-white text-sm">
            {plan.grupos.map((g) => (
              <li key={g.titulo} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate font-medium">{g.titulo}</span>
                <span className="shrink-0 text-[#6B7385]">{fill(m.porExpediente, { n: g.archivos.length, tamano: tamano(g.bytes) })}</span>
              </li>
            ))}
          </ul>
          {!corriendo && (
            <button type="button" className={genioPrimary} disabled={plan.documentos === 0 || noCabe} onClick={() => void empezar()}>
              {fill(m.importar, { n: plan.grupos.length })}
            </button>
          )}
        </div>
      )}

      {corriendo && progreso && (
        <div role="status" aria-live="polite" className="space-y-2">
          <p className="text-sm font-medium">{fill(m.progreso, { hechos: progreso.hechos, total: progreso.total })}</p>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3E7EE]">
            <div className="h-full rounded-full bg-[#17233A] transition-[width]" style={{ width: `${progreso.total ? (100 * progreso.hechos) / progreso.total : 0}%` }} />
          </div>
          <p className="truncate text-xs text-[#6B7385]">{progreso.actual}</p>
          <p className="text-xs text-[#6B7385]">{m.noCerrar}</p>
        </div>
      )}

      {informe && (
        <div className="space-y-3 rounded-xl border border-[#E3E7EE] p-4">
          <p className="font-semibold text-[#2F6B4F]">{fill(m.listo, { subidos: informe.subidos, creados: informe.creados, reutilizados: informe.reutilizados })}</p>
          {informe.yaEstaban > 0 && <p className="text-sm text-[#3B4558]">{fill(m.yaEstaban, { n: informe.yaEstaban })}</p>}
          {informe.detenido === "ESPACIO_AGOTADO" && (
            <p role="alert" className="text-sm font-medium text-[#8E2C3A]">
              {m.detenidoEspacio} <Link href="/legal/config#plan-almacenamiento" className="underline">{m.ampliar}</Link>
            </p>
          )}
          {informe.detenido === "SIN_PERMISO" && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{m.detenidoPermiso}</p>}
          {informe.errores.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-[#8E2C3A]">{fill(m.errores, { n: informe.errores.length })}</summary>
              <ul className="mt-2 space-y-1">{informe.errores.map((x, i) => <li key={i}><span className="font-medium">{x.ruta}</span>: {x.mensaje}</li>)}</ul>
            </details>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={genioButton} onClick={() => { setPlan(null); setInforme(null); setProgreso(null); }}>{m.otra}</button>
            {informe.detenido && plan && <button type="button" className={genioPrimary} onClick={() => { setInforme(null); void empezar(); }}>{m.reintentar}</button>}
          </div>
          <p className="text-xs text-[#6B7385]">{m.repetir}</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{error}</p>}
    </section>
  );
}
