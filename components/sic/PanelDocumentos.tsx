"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { subirDocumento, type Documento } from "@/lib/api/sic";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(tipo: string) {
  if (tipo.startsWith("image/")) return "\uD83D\uDDBC"; // frame with picture
  if (tipo === "application/pdf") return "\uD83D\uDCC4"; // page facing up
  return "\uD83D\uDCCE"; // paperclip
}

interface Props {
  expedienteId: string;
  tenantId: string;
  documentos: Documento[];
  demoMode?: boolean;
  onUploadComplete: () => void;
}

export function PanelDocumentos({
  expedienteId,
  tenantId,
  documentos,
  demoMode,
  onUploadComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_MIME.has(file.type)) {
        setError(`Tipo no permitido: ${file.type || file.name.split(".").pop()}`);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`Archivo excede 20 MB (${formatBytes(file.size)})`);
        return;
      }

      if (demoMode) {
        setSuccess(`[Demo] ${file.name} subido`);
        onUploadComplete();
        return;
      }

      setUploading(true);
      setError(null);
      try {
        await subirDocumento(expedienteId, tenantId, file);
        setSuccess(`${file.name} subido correctamente`);
        onUploadComplete();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setUploading(false);
      }
    },
    [expedienteId, tenantId, demoMode, onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${dragOver ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 bg-slate-800/30 hover:border-slate-500"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFileChange}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Subiendo...</p>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400">
              Arrastra archivos o haz clic para seleccionar
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              PDF, JPG, PNG, WebP - max 20 MB
            </p>
          </>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 rounded px-2 py-1">
          {success}
        </p>
      )}

      {/* Document list */}
      {documentos.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {documentos.map((doc) => (
            <li
              key={doc.documento_id}
              className="flex items-center gap-2 p-2 bg-slate-800/50 rounded hover:bg-slate-800/80"
            >
              <span className="text-base">{fileIcon(doc.tipo_documento)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 truncate">{doc.nombre_archivo}</p>
                <p className="text-slate-500">
                  {formatBytes(doc.tamano_bytes)}
                  {doc.fecha_subida && (
                    <span className="ml-2">{doc.fecha_subida}</span>
                  )}
                </p>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  doc.estado_documento === "SUBIDO"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {doc.estado_documento}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 italic">Sin documentos adjuntos</p>
      )}
    </div>
  );
}
