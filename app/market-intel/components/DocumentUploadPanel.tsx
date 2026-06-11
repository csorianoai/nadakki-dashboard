"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

interface DocumentUploadPanelProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  lastUploaded?: string | null;
}

export function DocumentUploadPanel({ onUpload, uploading, lastUploaded }: DocumentUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await onUpload(file);
    } catch {
      setError("No se pudo subir el documento.");
    }
  };

  return (
    <section
      className="rounded-forge-lg border border-dashed border-forgeGray-300 bg-forgeSurface-sunken p-4"
      aria-labelledby="document-upload-title"
    >
      <h3 id="document-upload-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Documento informativo
      </h3>
      <p className="mt-1 text-forge-sm text-forgeGray-600">
        El archivo se registra como fuente <code className="font-forgeMono text-forge-xs">operator_upload</code> y
        se reflejará al re-investigar.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="sr-only"
          id="market-intel-doc-upload"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <label
          htmlFor="market-intel-doc-upload"
          className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-forge-sm border border-forgeGray-200 bg-white px-4 py-2 text-forge-sm font-medium text-forgeGray-700 shadow-forge-xs transition-colors hover:bg-forgeGray-50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mee-accent)]"
        >
          <FileUp className="h-4 w-4" aria-hidden />
          {uploading ? "Subiendo…" : "Seleccionar archivo"}
        </label>
        {lastUploaded ? (
          <p className="text-forge-xs text-forgeSuccess-700" role="status">
            Último: {lastUploaded}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-forge-sm text-forgeDanger-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
