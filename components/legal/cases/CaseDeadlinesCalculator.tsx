"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeadlineCatalog, postCaseAction, type PlazoDelCatalogo } from "@/lib/legal/cases/legal-cases-api";
import type { CaseDocument } from "@/lib/legal/cases/case-types";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";

/**
 * Calcular plazos con la fecha real del hecho y registrar los que fija el tribunal
 * (recorrido QA 23-nov-2026: «Calcular plazos» llevaba a esta pantalla y no había
 * formulario; un expediente civil no tenía ningún plazo posible).
 *
 * El sistema NO adivina la fecha: el abogado la indica (o viene de la notificación
 * que subió). Un plazo sin fecha real no se crea.
 */

const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

function textoError(e: unknown): string {
  if (e instanceof LegalApiHttpError) {
    if (e.status === 403) return "Tu rol no permite gestionar plazos en este expediente.";
    if (e.status === 409) return e.detail || "El expediente está bloqueado o la acción no está disponible en este estado.";
    if (e.status === 423) return "El expediente está bloqueado por otra persona. Inténtalo en unos minutos.";
    return e.detail || `No se pudo guardar (HTTP ${e.status}). No se guardó nada.`;
  }
  return "No hubo respuesta del servidor. No se guardó nada.";
}

export function nombrePlazo(p: PlazoDelCatalogo): string {
  const quien = p.procedimiento ? p.procedimiento.charAt(0).toUpperCase() + p.procedimiento.slice(1) : p.deadline_db_id;
  return `${quien} — ${p.valor} ${p.unidad.replace("_", " ")}`;
}

export function CaseDeadlinesCalculator({
  tenantId,
  caseId,
  documents,
  docInicial,
  fechaInicial,
  onSaved,
}: {
  tenantId: string;
  caseId: string;
  documents: CaseDocument[];
  docInicial?: string | null;
  fechaInicial?: string | null;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const catalogo = useQuery({
    queryKey: ["legal_deadline_catalog", tenantId, caseId],
    queryFn: () => fetchDeadlineCatalog(tenantId, caseId),
  });
  const [modo, setModo] = useState<"catalogo" | "tribunal">("catalogo");
  const [plazo, setPlazo] = useState("");
  const [fecha, setFecha] = useState(fechaInicial ?? "");
  const [doc, setDoc] = useState(docInicial ?? "");
  const [desc, setDesc] = useState("");
  const [desde, setDesde] = useState("");
  const [limite, setLimite] = useState("");
  const [base, setBase] = useState("");
  const [perentorio, setPerentorio] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (fechaInicial) setFecha(fechaInicial);
    if (docInicial) setDoc(docInicial);
  }, [fechaInicial, docInicial]);

  const elegido = useMemo(() => (catalogo.data ?? []).find((p) => p.deadline_db_id === plazo) ?? null, [catalogo.data, plazo]);

  const guardar = async (accion: string, payload: Record<string, unknown>, aviso: string): Promise<boolean> => {
    setError(null);
    setOk(null);
    setEnviando(true);
    try {
      const r = (await postCaseAction(tenantId, caseId, accion, payload)) as { skipped?: string[] } | null;
      if (r?.skipped?.length) {
        setError("Este plazo no aplica a este expediente. No se guardó nada.");
        return false;
      }
      setOk(aviso);
      await qc.invalidateQueries({ queryKey: ["legal_case", tenantId, caseId] });
      onSaved?.();
      return true;
    } catch (e) {
      setError(textoError(e));
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const calcular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plazo || !fecha) return;
    void guardar(
      "compute_deadlines",
      { deadline_db_id: plazo, trigger_date: fecha, ...(doc ? { trigger_document_id: doc } : {}) },
      "Plazo calculado. Revísalo en la lista: la fecha final la valida el abogado.",
    ).then((guardado) => guardado && setPlazo(""));
  };

  const registrar = (e: React.FormEvent) => {
    e.preventDefault();
    void guardar(
      "add_manual_deadline",
      {
        descripcion: desc.trim(),
        fecha_resolucion: desde,
        fecha_limite: limite,
        ...(base.trim() ? { base_legal: base.trim() } : {}),
        perentorio,
        ...(doc ? { document_id: doc } : {}),
      },
      "Plazo del tribunal registrado.",
    ).then((guardado) => {
      if (!guardado) return;
      setDesc("");
      setLimite("");
    });
  };

  return (
    <section aria-labelledby="calcular-plazos" className="rounded-forge-md border border-slate-200 bg-white p-4">
      <h2 id="calcular-plazos" className="text-sm font-semibold text-slate-900">Agregar un plazo</h2>
      <div role="tablist" aria-label="Tipo de plazo" className="mt-2 flex gap-4 border-b border-slate-200 text-sm">
        {(
          [
            ["catalogo", "Plazo legal (desde un hecho)"],
            ["tribunal", "Plazo fijado por el tribunal"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={modo === k}
            onClick={() => setModo(k)}
            className={`-mb-px border-b-2 px-1 py-2 ${modo === k ? "border-blue-700 font-semibold text-blue-800" : "border-transparent text-slate-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === "catalogo" ? (
        <form onSubmit={calcular} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Plazo
            <select className={input} value={plazo} onChange={(e) => setPlazo(e.target.value)} required>
              <option value="">{catalogo.isLoading ? "Cargando…" : "Elegir…"}</option>
              {(catalogo.data ?? []).map((p) => (
                <option key={p.deadline_db_id} value={p.deadline_db_id}>
                  {nombrePlazo(p)}
                </option>
              ))}
            </select>
          </label>
          {catalogo.isError ? (
            <p role="alert" className="text-xs text-red-700 sm:col-span-2">No se pudo cargar el catálogo de plazos. Recarga la página.</p>
          ) : null}
          {!catalogo.isLoading && !catalogo.isError && (catalogo.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-600 sm:col-span-2">
              El catálogo no tiene plazos legales para esta materia. Registra los que fije el tribunal en la otra pestaña.
            </p>
          ) : null}
          {elegido ? (
            <p className="rounded bg-slate-50 p-2 text-xs text-slate-700 sm:col-span-2">
              <strong>Corre {elegido.corre_desde.replace(/^Desde/i, "desde")}.</strong> {elegido.base_legal}
              {elegido.perentorio ? " · Perentorio" : ""}
            </p>
          ) : null}
          <label className="text-xs font-medium text-slate-700">
            Fecha del hecho (notificación, depósito…)
            <input type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Documento que lo origina (opcional)
            <select className={input} value={doc} onChange={(e) => setDoc(e.target.value)}>
              <option value="">— Ninguno —</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando || !plazo || !fecha}
              className="rounded-forge-sm bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {enviando ? "Calculando…" : "Calcular plazo"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={registrar} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Qué hay que hacer
            <input
              className={input}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej.: Depositar escrito de réplica a la demanda reconvencional"
              minLength={5}
              required
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Fecha de la audiencia o resolución
            <input type="date" className={input} value={desde} onChange={(e) => setDesde(e.target.value)} required />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Fecha límite
            <input type="date" className={input} value={limite} min={desde || undefined} onChange={(e) => setLimite(e.target.value)} required />
          </label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Fundamento (opcional)
            <input className={input} value={base} onChange={(e) => setBase(e.target.value)} placeholder="Ej.: Sentencia in voce de la audiencia del 25-nov" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={perentorio} onChange={(e) => setPerentorio(e.target.checked)} />
            Perentorio (vencido, se pierde el derecho)
          </label>
          <label className="text-xs font-medium text-slate-700">
            Documento relacionado (opcional)
            <select className={input} value={doc} onChange={(e) => setDoc(e.target.value)}>
              <option value="">— Ninguno —</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-forge-sm bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {enviando ? "Guardando…" : "Registrar plazo"}
            </button>
          </div>
        </form>
      )}
      <div aria-live="polite" className="mt-2 text-xs">
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}
        {ok ? <p className="text-emerald-700">{ok}</p> : null}
      </div>
    </section>
  );
}
