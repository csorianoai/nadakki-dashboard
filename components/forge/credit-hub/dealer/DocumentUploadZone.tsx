"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Camera, FileUp, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ACCEPT_STRING = "image/jpeg,image/png,image/webp,application/pdf";

export type UploadStatus = "idle" | "selected" | "uploading" | "uploaded" | "error";

export interface DocumentUploadZoneProps {
  documentKey: string;
  disabled?: boolean;
  file: File | null;
  status: UploadStatus;
  previewUrl?: string | null;
  errorMessage?: string | null;
  onFileSelect: (key: string, file: File | null) => void;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Formato no soportado: ${file.type || "desconocido"}. Use JPG, PNG, WEBP o PDF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Archivo muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo 10 MB.`;
  }
  return null;
}

export function DocumentUploadZone({
  documentKey,
  disabled,
  file,
  status,
  previewUrl,
  errorMessage,
  onFileSelect,
}: DocumentUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFile = useCallback(
    (f: File | null) => {
      setValidationError(null);
      if (!f) {
        onFileSelect(documentKey, null);
        return;
      }
      const err = validateFile(f);
      if (err) {
        setValidationError(err);
        return;
      }
      onFileSelect(documentKey, f);
    },
    [documentKey, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [disabled, handleFile],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleRemove = useCallback(() => {
    setValidationError(null);
    onFileSelect(documentKey, null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [documentKey, onFileSelect]);

  const displayError = validationError || errorMessage;
  const isImage = file?.type.startsWith("image/");

  // File is selected or uploaded — show preview
  if (file && (status === "selected" || status === "uploading" || status === "uploaded")) {
    return (
      <div className="mt-2 flex items-start gap-3 rounded-forge-sm border border-forgeGray-200 bg-white p-3">
        {/* Thumbnail */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-forge-sm border border-forgeGray-100 bg-forgeGray-50">
          {isImage && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-6 w-6 text-forgeGray-400" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-forge-sm font-medium text-forgeGray-800">{file.name}</p>
          <p className="text-forge-xs text-forgeGray-500">{(file.size / 1024).toFixed(0)} KB</p>
          <div className="mt-1 flex items-center gap-1.5">
            {status === "uploading" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-forgeBrand-500" />
                <span className="text-forge-xs text-forgeBrand-600">Subiendo...</span>
              </>
            )}
            {status === "uploaded" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-forgeSuccess-600" />
                <span className="text-forge-xs text-forgeSuccess-700">Subido</span>
              </>
            )}
            {status === "selected" && (
              <>
                <FileUp className="h-3.5 w-3.5 text-forgeBrand-500" />
                <span className="text-forge-xs text-forgeBrand-600">Listo para subir</span>
              </>
            )}
          </div>
        </div>

        {/* Remove button */}
        {status !== "uploading" && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="shrink-0 rounded-forge-sm p-1 text-forgeGray-400 hover:bg-forgeGray-100 hover:text-forgeGray-600"
            aria-label="Eliminar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Error state (upload failed) with file still referenced
  if (status === "error" && file) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-start gap-3 rounded-forge-sm border border-forgeDanger-200 bg-forgeDanger-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-forgeDanger-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-forge-sm font-medium text-forgeGray-800">{file.name}</p>
            <p className="text-forge-xs text-forgeDanger-600">{displayError || "Error al subir"}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="shrink-0 rounded-forge-sm p-1 text-forgeGray-400 hover:bg-forgeGray-100 hover:text-forgeGray-600"
            aria-label="Eliminar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Empty / idle state — dropzone
  return (
    <div className="mt-2 space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center gap-2 rounded-forge-sm border-2 border-dashed p-4 text-center transition-colors",
          dragOver && !disabled
            ? "border-forgeBrand-400 bg-forgeBrand-50"
            : "border-forgeGray-200 bg-forgeGray-50",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <FileUp className="h-6 w-6 text-forgeGray-400" />
        <p className="text-forge-xs text-forgeGray-500">
          Arrastrá un archivo aquí o usá los botones
        </p>
        <p className="text-[11px] text-forgeGray-400">JPG, PNG, WEBP o PDF — máx. 10 MB</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* File picker */}
        <label
          className={cn(
            "inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-forge-sm border border-forgeGray-200 bg-white px-3 py-2 text-forge-xs font-medium text-forgeGray-700 shadow-forge-xs transition-colors hover:bg-forgeGray-50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <FileUp className="h-4 w-4" />
          Seleccionar archivo
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {/* Camera capture (mobile) */}
        <label
          className={cn(
            "inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-forge-sm border border-forgeGray-200 bg-white px-3 py-2 text-forge-xs font-medium text-forgeGray-700 shadow-forge-xs transition-colors hover:bg-forgeGray-50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Camera className="h-4 w-4" />
          Tomar foto
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {displayError && (
        <div className="flex items-start gap-1.5 text-forge-xs text-forgeDanger-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
