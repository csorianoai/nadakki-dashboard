"use client";

import {
  Archive,
  CheckCircle2,
  File,
  FileCode,
  FileImage,
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import type { UploadedFile } from "@/lib/shared/document-upload-types";
import { UploadProgress } from "@/components/shared/UploadProgress";
import { cn } from "@/lib/utils";

function iconForMime(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return FileText;
  if (n.endsWith(".doc") || n.endsWith(".docx")) return FileCode;
  if (/\.(png|jpg|jpeg|gif|webp|heic|tiff?)$/i.test(n)) return FileImage;
  if (n.endsWith(".zip")) return Archive;
  return File;
}

export function FileItem({
  file,
  onRemove,
  onViewExtracted,
  compact,
}: {
  file: UploadedFile;
  onRemove: () => void;
  onViewExtracted?: () => void;
  compact?: boolean;
}) {
  const Ico = iconForMime(file.name);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3",
        compact && "p-2"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-violet-300">
        <Ico className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-zinc-100">{file.name}</p>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
            aria-label={`Quitar ${file.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs tabular-nums text-zinc-500">
          {(file.size / 1024).toFixed(1)} KB
          {file.type ? ` · ${file.type}` : ""}
        </p>
        {file.status === "uploading" || file.status === "processing" ? (
          <div className="mt-2 space-y-1">
            <UploadProgress value={file.progress ?? 0} />
            <div className="flex items-center gap-2 text-xs text-violet-300">
              {file.status === "processing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              <span>{file.status === "processing" ? "Extrayendo información con IA…" : "Subiendo…"}</span>
            </div>
          </div>
        ) : null}
        {file.status === "error" ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {file.error ?? "Error al procesar"}
          </p>
        ) : null}
        {file.status === "ready" ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Procesado
            </span>
            {file.extractedData && onViewExtracted ? (
              <button
                type="button"
                onClick={onViewExtracted}
                className="text-xs font-medium text-violet-400 underline-offset-2 hover:underline"
              >
                Ver datos extraídos
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
