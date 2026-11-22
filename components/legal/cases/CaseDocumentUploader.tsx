"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDocumentsStorage, ingestDocument, type DocumentUploadMeta } from "@/lib/legal/cases/legal-cases-api";
import { mensajeDeError } from "@/lib/legal/cases/mensajes-error";

export const TIPOS_DOCUMENTO: { value: string; label: string }[] = [
  { value: "", label: "Sin clasificar (lo revisará el abogado)" },
  { value: "demanda", label: "Demanda / acto de emplazamiento" },
  { value: "notificacion", label: "Acto de notificación" },
  { value: "sentencia", label: "Sentencia o resolución" },
  { value: "escrito", label: "Escrito o instancia" },
  { value: "contrato", label: "Contrato" },
  { value: "prueba", label: "Prueba documental" },
  { value: "otro", label: "Otro" },
];
const TIPOS_ARCHIVO = ["application/pdf", "image/png", "image/jpeg"];
const MB_POR_DEFECTO = 15;

const campo = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

type Estado = { tipo: "inactivo" } | { tipo: "subiendo" } | { tipo: "ok"; nombre: string } | { tipo: "error"; mensaje: string };

/** Valida tipo y tamaño en el navegador; el backend vuelve a validar por firma de bytes. */
export function validarArchivo(f: File, maxMb: number): string | null {
  const ext = f.name.toLowerCase().split(".").pop() ?? "";
  if (!TIPOS_ARCHIVO.includes(f.type) && !["pdf", "png", "jpg", "jpeg"].includes(ext)) return "Solo se aceptan PDF, PNG o JPEG.";
  if (f.size === 0) return "El archivo está vacío.";
  if (f.size > maxMb * 1024 * 1024) return `El archivo supera el máximo de ${maxMb} MB.`;
  return null;
}

/**
 * Subir un documento al expediente con su clasificación, dirección y fechas.
 * El éxito se anuncia solo después del 201 (archivo cifrado guardado y registrado).
 */
export function CaseDocumentUploader({ tenantId, caseId, onUploaded }: { tenantId: string; caseId: string; onUploaded: () => void }) {
  const ids = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [meta, setMeta] = useState<DocumentUploadMeta>({ direction: "incoming" });
  const [estado, setEstado] = useState<Estado>({ tipo: "inactivo" });
  const storage = useQuery({
    queryKey: ["legal_documents_storage", tenantId, caseId],
    queryFn: () => fetchDocumentsStorage(tenantId, caseId),
    staleTime: 60_000,
    retry: false,
  });
  const maxMb = storage.data?.max_mb ?? MB_POR_DEFECTO;
  const noDisponible = storage.data?.disponible === false;
  useEffect(() => {
    if (estado.tipo === "ok") setArchivo(null);
  }, [estado]);

  const elegir = (f: File | undefined | null) => {
    if (!f) return;
    const problema = validarArchivo(f, maxMb);
    setEstado(problema ? { tipo: "error", mensaje: problema } : { tipo: "inactivo" });
    setArchivo(problema ? null : f);
  };

  const subir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      setEstado({ tipo: "error", mensaje: "Elige un archivo PDF, PNG o JPEG." });
      return;
    }
    if (meta.notification_date && meta.direction !== "incoming") {
      setEstado({ tipo: "error", mensaje: "La fecha de notificación solo aplica a documentos recibidos." });
      return;
    }
    setEstado({ tipo: "subiendo" });
    const fd = new FormData();
    fd.append("file", archivo);
    try {
      await ingestDocument(tenantId, caseId, fd, meta);
      setEstado({ tipo: "ok", nombre: archivo.name });
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (err) {
      setEstado({ tipo: "error", mensaje: mensajeDeError(err, "subir") });
    }
  };

  const set = <K extends keyof DocumentUploadMeta>(k: K, v: DocumentUploadMeta[K]) => setMeta((m) => ({ ...m, [k]: v }));

  return (
    <form onSubmit={subir} aria-labelledby={`${ids}-t`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" data-testid="subir-documento">
      <h2 id={`${ids}-t`} className="text-sm font-semibold text-slate-900">Subir documento</h2>
      {noDisponible ? (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          El almacenamiento seguro de documentos no está disponible ahora mismo. No se puede subir nada hasta que se restablezca.
        </p>
      ) : null}
      <div>
        <label htmlFor={`${ids}-f`} className="block text-sm font-medium text-slate-700">Archivo (PDF, PNG o JPEG, hasta {maxMb} MB) *</label>
        <input
          id={`${ids}-f`}
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          disabled={noDisponible || estado.tipo === "subiendo"}
          onChange={(e) => elegir(e.target.files?.[0])}
          className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Tipo de documento
          <select value={meta.document_type ?? ""} onChange={(e) => set("document_type", e.target.value || undefined)} className={campo}>
            {TIPOS_DOCUMENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Dirección
          <select value={meta.direction} onChange={(e) => set("direction", e.target.value as DocumentUploadMeta["direction"])} className={campo}>
            <option value="incoming">Recibido (de la otra parte o del tribunal)</option>
            <option value="outgoing">Emitido por el despacho</option>
            <option value="internal">Interno</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Fecha del documento
          <input type="date" value={meta.document_date ?? ""} onChange={(e) => set("document_date", e.target.value || undefined)} className={campo} />
        </label>
        {meta.direction === "incoming" ? (
          <label className="block text-sm font-medium text-slate-700">
            Fecha de notificación (si consta)
            <input type="date" value={meta.notification_date ?? ""} onChange={(e) => set("notification_date", e.target.value || undefined)} className={campo} />
            <span className="mt-1 block text-xs font-normal text-slate-500">Déjala vacía si no hay constancia de notificación; no se calcularán plazos sin ella.</span>
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={noDisponible || !archivo || estado.tipo === "subiendo"}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          {estado.tipo === "subiendo" ? "Subiendo…" : "Subir documento"}
        </button>
        {archivo && estado.tipo !== "subiendo" ? <span className="text-sm text-slate-600">{archivo.name}</span> : null}
        {estado.tipo === "subiendo" ? <span role="status" aria-live="polite" className="text-sm text-slate-600">Cifrando y guardando…</span> : null}
      </div>
      {estado.tipo === "ok" ? <p role="status" className="text-sm text-emerald-700">«{estado.nombre}» quedó guardado en el expediente.</p> : null}
      {estado.tipo === "error" ? <p role="alert" className="text-sm text-red-700">{estado.mensaje}</p> : null}
    </form>
  );
}
