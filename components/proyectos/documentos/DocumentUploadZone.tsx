"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import { ACCEPT_ATTR } from "./documentos-constants";
import { validateDocumentFile } from "./documentos-helpers";

interface DocumentUploadZoneProps {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function DocumentUploadZone({ disabled, onFilesSelected }: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return;
      const valid: File[] = [];
      for (const file of Array.from(fileList)) {
        const err = validateDocumentFile(file);
        if (err) {
          toast.error(`Archivo rechazado: ${file.name}`, { description: err });
          continue;
        }
        valid.push(file);
      }
      if (valid.length) onFilesSelected(valid);
    },
    [disabled, onFilesSelected],
  );

  return (
    <GlassCard hover={false} className="border border-dashed border-amber-500/35 bg-amber-500/[0.03] p-6">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          processFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-amber-400 bg-amber-500/10"
            : "border-white/15 bg-black/20 hover:border-amber-400/50 hover:bg-amber-500/[0.06]"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="mb-3 h-10 w-10 text-amber-300" aria-hidden />
        <p className="text-sm font-semibold text-white">Arrastra archivos o selecciona desde tu equipo</p>
        <p className="mt-2 max-w-md text-xs text-zinc-400">
          PDF, imágenes, Office, CSV, TXT — máximo 20 MB por archivo
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-5 min-h-10 border-white/15 bg-white/10 text-white hover:bg-amber-500/20"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Seleccionar archivos
        </Button>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BP_ACCENTS.glow }}>
          Vault cifrado · S3 + Fernet
        </p>
      </div>
    </GlassCard>
  );
}
