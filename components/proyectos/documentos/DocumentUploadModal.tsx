"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal, Select } from "@/components/forge";
import { createDocumento, ProyectosApiError } from "@/app/hooks/useProyectos";
import {
  CLASSIFICATION_LABELS,
  DOC_TYPE_CUSTOM,
  DOC_TYPE_SUGGESTIONS,
  type DocumentClassification,
} from "./documentos-constants";
import { formatDocumentBytes } from "./documentos-helpers";

interface UploadQueueItem {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface DocumentUploadModalProps {
  open: boolean;
  tenantId: string;
  proyectoId: string;
  files: File[];
  onClose: () => void;
  onComplete: () => void;
}

export function DocumentUploadModal({
  open,
  tenantId,
  proyectoId,
  files,
  onClose,
  onComplete,
}: DocumentUploadModalProps) {
  const [docTypeSelect, setDocTypeSelect] = useState("otro");
  const [customDocType, setCustomDocType] = useState("");
  const [classification, setClassification] = useState<DocumentClassification>("confidential");
  const [docSubtype, setDocSubtype] = useState("");
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQueue(files.map((file) => ({ file, progress: 0, status: "pending" as const })));
    setDocTypeSelect("otro");
    setCustomDocType("");
    setClassification("confidential");
    setDocSubtype("");
    setUploading(false);
  }, [open, files]);

  const resolvedDocType = useMemo(() => {
    if (docTypeSelect === DOC_TYPE_CUSTOM) return customDocType.trim() || "otro";
    return docTypeSelect;
  }, [customDocType, docTypeSelect]);

  const classificationOptions = useMemo(
    () =>
      (Object.entries(CLASSIFICATION_LABELS) as [DocumentClassification, string][]).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const docTypeOptions = useMemo(
    () => [
      ...DOC_TYPE_SUGGESTIONS.map((o) => ({ value: o.value, label: o.label })),
      { value: DOC_TYPE_CUSTOM, label: "Personalizado…" },
    ],
    [],
  );

  const runUploads = useCallback(async () => {
    if (!tenantId || !files.length) return;
    setUploading(true);

    const metadata = {
      doc_type: resolvedDocType,
      classification,
      doc_subtype: docSubtype.trim() || undefined,
    };

    let successCount = 0;

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading", progress: 0, error: undefined } : item)),
      );

      try {
        await createDocumento(tenantId, proyectoId, file, metadata, (percent) => {
          setQueue((prev) => prev.map((item, idx) => (idx === i ? { ...item, progress: percent } : item)));
        });
        successCount += 1;
        setQueue((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "done", progress: 100 } : item)));
      } catch (e) {
        const msg = e instanceof ProyectosApiError ? e.message : e instanceof Error ? e.message : "Error al subir";
        setQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "error", error: msg } : item)),
        );
        toast.error(`No se pudo subir ${file.name}`, { description: msg.slice(0, 180) });
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(successCount === 1 ? "Documento subido" : `${successCount} documentos subidos`);
      onComplete();
      if (successCount === files.length) onClose();
    }
  }, [classification, docSubtype, files, onClose, onComplete, proyectoId, resolvedDocType, tenantId]);

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [onClose, uploading]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            role="presentation"
            aria-hidden
            onClick={handleClose}
          />,
          document.body,
        )
      : null;

  return (
    <>
      {overlay}
      <Modal
        open={open}
        onClose={handleClose}
        closeOnBackdropClick={false}
        className="!z-50 backdrop:bg-transparent"
        title="Metadatos del documento"
      description="Asigna tipo y clasificación antes de subir. Los mismos metadatos se aplican a todos los archivos de esta tanda."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={uploading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={uploading || !files.length} onClick={() => void runUploads()}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Subiendo…
              </>
            ) : (
              `Subir ${files.length} archivo${files.length === 1 ? "" : "s"}`
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Tipo de documento"
          value={docTypeSelect}
          onChange={(e) => setDocTypeSelect(e.target.value)}
          options={docTypeOptions}
          disabled={uploading}
        />
        {docTypeSelect === DOC_TYPE_CUSTOM ? (
          <Input
            label="Tipo personalizado"
            value={customDocType}
            onChange={(e) => setCustomDocType(e.target.value)}
            placeholder="ej. permiso_municipal_zone_A"
            disabled={uploading}
          />
        ) : null}

        <Select
          label="Clasificación (ENUM)"
          value={classification}
          onChange={(e) => setClassification(e.target.value as DocumentClassification)}
          options={classificationOptions}
          disabled={uploading}
        />

        <Input
          label="Subtipo (opcional)"
          value={docSubtype}
          onChange={(e) => setDocSubtype(e.target.value)}
          placeholder="Ej. fase II ambiental"
          disabled={uploading}
        />

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Cola de archivos</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {queue.map((item) => (
              <li key={`${item.file.name}-${item.file.size}`} className="rounded-lg bg-white/[0.04] px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-zinc-100">{item.file.name}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{formatDocumentBytes(item.file.size)}</span>
                </div>
                {item.status === "uploading" || item.status === "done" ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "done" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
                {item.status === "error" && item.error ? (
                  <p className="mt-1 text-xs text-rose-300">{item.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
    </>
  );
}
