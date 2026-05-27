"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import {
  deleteDocumento,
  downloadDocumento,
  ProyectosApiError,
} from "@/app/hooks/useProyectos";
import {
  CLASSIFICATION_BADGE,
  CLASSIFICATION_LABELS,
  type DocumentClassification,
} from "./documentos-constants";
import {
  docTypeLabel,
  formatDocumentBytes,
  formatRelativeUploadTime,
  isDocumentClassification,
  type ProyectoDocumento,
} from "./documentos-helpers";

interface DocumentListTableProps {
  tenantId: string;
  documents: ProyectoDocumento[];
  loading: boolean;
  onRefresh: () => void;
  /** True when the project has documents but filters excluded all rows. */
  filteredEmpty?: boolean;
}

function docIcon(filename: string, mime?: string) {
  const lower = filename.toLowerCase();
  if (mime?.startsWith("image/") || /\.(jpe?g|png)$/i.test(lower)) {
    return <Image className="h-4 w-4 text-sky-300" aria-hidden />;
  }
  if (/\.(xls|xlsx|csv)$/i.test(lower)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-300" aria-hidden />;
  }
  return <FileText className="h-4 w-4 text-amber-300" aria-hidden />;
}

function classificationBadge(classification: string) {
  const key = isDocumentClassification(classification) ? classification : "confidential";
  const label = isDocumentClassification(classification)
    ? CLASSIFICATION_LABELS[classification]
    : classification;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CLASSIFICATION_BADGE[key as DocumentClassification]}`}
    >
      {label}
    </span>
  );
}

export function DocumentListTable({
  tenantId,
  documents,
  loading,
  onRefresh,
  filteredEmpty = false,
}: DocumentListTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDownload = async (doc: ProyectoDocumento) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocumento(tenantId, doc.id, doc.filename_original);
      toast.success("Descarga iniciada", { description: doc.filename_original });
    } catch (e) {
      const msg = e instanceof ProyectosApiError ? e.message : e instanceof Error ? e.message : "Error al descargar";
      toast.error("No se pudo descargar", { description: msg.slice(0, 180) });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: ProyectoDocumento) => {
    const ok = window.confirm(
      "¿Borrar este documento? El archivo se preserva en S3 como respaldo pero desaparecerá de la vista.",
    );
    if (!ok) return;

    setDeletingId(doc.id);
    try {
      await deleteDocumento(tenantId, doc.id);
      toast.success("Documento eliminado", { description: doc.filename_original });
      onRefresh();
    } catch (e) {
      const msg = e instanceof ProyectosApiError ? e.message : e instanceof Error ? e.message : "Error al eliminar";
      toast.error("No se pudo eliminar", { description: msg.slice(0, 180) });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <GlassCard hover={false} className="flex min-h-[200px] items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-amber-300" aria-hidden />
        <span className="sr-only">Cargando documentos…</span>
      </GlassCard>
    );
  }

  if (documents.length === 0) {
    return (
      <GlassCard hover={false} className="border border-dashed border-amber-500/35 bg-amber-500/[0.04] p-10 text-center">
        <FileText className="mx-auto h-12 w-12 text-amber-300/80" aria-hidden />
        {filteredEmpty ? (
          <>
            <p className="mt-4 text-lg font-semibold text-amber-100">Ningún documento coincide con los filtros</p>
            <p className="mt-2 text-sm text-zinc-400">Ajusta la búsqueda o quita filtros de tipo/clasificación.</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg font-semibold text-amber-100">Aún no hay documentos en este proyecto</p>
            <p className="mt-2 text-sm text-zinc-400">
              Sube títulos, tasaciones, permisos o contratos usando la zona de carga superior.
            </p>
          </>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm text-zinc-200">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Clasificación</th>
              <th className="px-4 py-3 text-right">Tamaño</th>
              <th className="px-4 py-3">Subido</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {docIcon(doc.filename_original, doc.mime_type)}
                    <span className="truncate font-medium text-white" title={doc.filename_original}>
                      {doc.filename_original}
                    </span>
                  </div>
                  {doc.doc_subtype ? (
                    <p className="mt-0.5 truncate pl-6 text-[11px] text-zinc-500">{doc.doc_subtype}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{docTypeLabel(doc.doc_type)}</td>
                <td className="px-4 py-3">{classificationBadge(doc.classification)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">
                  {formatDocumentBytes(doc.size_bytes)}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{formatRelativeUploadTime(doc.uploaded_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-9 border-white/15 bg-white/10 px-3 text-xs text-white hover:bg-sky-500/20"
                      disabled={downloadingId === doc.id || deletingId === doc.id}
                      onClick={() => void handleDownload(doc)}
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-3.5 w-3.5" aria-hidden />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Descargar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-9 border-white/15 bg-white/10 px-3 text-xs text-rose-200 hover:bg-rose-500/20"
                      disabled={deletingId === doc.id || downloadingId === doc.id}
                      onClick={() => void handleDelete(doc)}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
