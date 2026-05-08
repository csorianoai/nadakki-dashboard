"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Archive, FileCode, FileText, Image as ImageIcon, Upload } from "lucide-react";
import type { UploadedFile } from "@/lib/shared/document-upload-types";
import { uploadLegalDocument } from "@/lib/legal/document-upload-client";
import { FileItem } from "@/components/shared/FileItem";
import { ExtractedDataPanel } from "@/components/shared/ExtractedDataPanel";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPT = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".heic", ".tiff", ".tif", ".zip"];

export type DocumentDropzoneProps = {
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  onUploadComplete?: (files: UploadedFile[]) => void | Promise<void>;
  onRemove?: (fileId: string) => void;
  onFilesChange?: (files: UploadedFile[]) => void;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  uploadedFiles?: UploadedFile[];
  compact?: boolean;
  className?: string;
};

function randomId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function extOk(name: string, acceptList: string[]) {
  const lower = name.toLowerCase();
  return acceptList.some((a) => lower.endsWith(a.replace(/^\./, "").toLowerCase()));
}

export function DocumentDropzone({
  accept = DEFAULT_ACCEPT,
  maxSize = 100 * 1024 * 1024,
  maxFiles = 10,
  multiple = true,
  onUploadComplete,
  onRemove,
  onFilesChange,
  title = "Arrastra los documentos aquí",
  subtitle = "o haz clic para seleccionar archivos",
  disabled = false,
  uploadedFiles: controlledFiles,
  compact = false,
  className,
}: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const [internal, setInternal] = useState<UploadedFile[]>([]);
  const files = controlledFiles ?? internal;

  const setFiles = useCallback(
    (next: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => {
      const base = controlledFiles ?? internal;
      const resolved = typeof next === "function" ? next(base) : next;
      if (controlledFiles === undefined) setInternal(resolved);
      onFilesChange?.(resolved);
    },
    [controlledFiles, internal, onFilesChange]
  );

  const [drag, setDrag] = useState(false);

  const acceptAttr = accept.map((a) => (a.startsWith(".") ? a : `.${a}`)).join(",");

  const [detailId, setDetailId] = useState<string | null>(null);

  const processOne = useCallback(
    async (file: File, id: string) => {
      try {
        const res = await uploadLegalDocument(file, (p) => {
          setFiles((prev) =>
            prev.map((x) =>
              x.id === id
                ? {
                    ...x,
                    progress: p,
                    status: p >= 96 ? "processing" : "uploading",
                  }
                : x
            )
          );
        });
        const ready: UploadedFile = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "ready",
          progress: 100,
          serverFileId: res.file_id,
          extractedData: res.extracted_data,
        };
        setFiles((prev) => {
          const merged = prev.map((x) => (x.id === id ? ready : x));
          void onUploadComplete?.(merged.filter((u) => u.status === "ready"));
          return merged;
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error de subida";
        setFiles((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "error", error: msg, progress: 0 } : x))
        );
      }
    },
    [onUploadComplete, setFiles]
  );

  const processFileList = useCallback(
    async (list: FileList | File[]) => {
      if (disabled) return;
      const arr = Array.from(list);
      const room = maxFiles - files.length;
      const take = arr.slice(0, Math.max(0, room));

      for (const file of take) {
        if (file.size > maxSize) {
          const id = randomId();
          setFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              status: "error",
              error: `Supera el límite de ${(maxSize / (1024 * 1024)).toFixed(0)} MB`,
            },
          ]);
          continue;
        }
        if (!extOk(file.name, accept)) {
          const id = randomId();
          setFiles((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              status: "error",
              error: "Tipo de archivo no permitido",
            },
          ]);
          continue;
        }
        const id = randomId();
        setFiles((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, type: file.type, status: "uploading", progress: 0 },
        ]);
        void processOne(file, id);
      }
    },
    [accept, disabled, files.length, maxFiles, maxSize, processOne, setFiles]
  );

  const openPicker = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    void processFileList(e.dataTransfer.files);
  };

  const remove = (fileId: string) => {
    setDetailId((d) => (d === fileId ? null : d));
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    onRemove?.(fileId);
  };

  const empty = files.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttr}
        multiple={multiple}
        aria-labelledby={labelId}
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const fl = e.target.files;
          if (fl?.length) void processFileList(fl);
          e.target.value = "";
        }}
      />

      {empty ? (
        <div
          role="button"
          tabIndex={0}
          id={labelId}
          aria-disabled={disabled}
          onClick={() => !disabled && openPicker()}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 md:p-12",
            compact && "p-6 md:p-8",
            drag
              ? "scale-[1.01] border-violet-500 bg-zinc-900/70"
              : "border-zinc-700 bg-zinc-900/30 hover:border-violet-500/50 hover:bg-zinc-900/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 transition-transform group-hover:scale-110",
              drag && "scale-110"
            )}
          >
            <Upload className="h-8 w-8 text-violet-300" aria-hidden />
          </div>
          <h3 className="mb-1 text-center text-lg font-medium text-zinc-100">
            {drag ? "Suelta los archivos aquí" : title}
          </h3>
          <p className="mb-4 text-center text-sm text-zinc-400">{subtitle}</p>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" aria-hidden />
              PDF
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <FileCode className="h-3 w-3" aria-hidden />
              Word
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" aria-hidden />
              Imágenes
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Archive className="h-3 w-3" aria-hidden />
              ZIP
            </span>
          </div>
          <p className="text-center text-[11px] text-zinc-600">
            Hasta {(maxSize / (1024 * 1024)).toFixed(0)} MB · La IA extraerá la información automáticamente (mock en
            desarrollo)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <FileItem
              key={f.id}
              file={f}
              compact={compact}
              onRemove={() => remove(f.id)}
              onViewExtracted={
                f.status === "ready" && f.extractedData
                  ? () => setDetailId((d) => (d === f.id ? null : f.id))
                  : undefined
              }
            />
          ))}
          {detailId ? (
            <ExtractedDataPanel
              data={files.find((x) => x.id === detailId)?.extractedData}
              editable
              className="mt-1"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled || files.length >= maxFiles}
              className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              + Agregar más
            </button>
            {multiple && files.length >= maxFiles ? (
              <span className="self-center text-xs text-zinc-500">Máximo {maxFiles} archivos</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
