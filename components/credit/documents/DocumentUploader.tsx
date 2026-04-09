"use client";

import { useEffect, useState } from "react";
import {
  CreditApiError,
  uploadDocument,
  type CreditDocument,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";

const DOCUMENT_TYPES: { value: string; label: string; category: string }[] = [
  { value: "CEDULA_FRENTE", label: "Cédula — frente", category: "IDENTIDAD" },
  { value: "CEDULA_REVERSO", label: "Cédula — reverso", category: "IDENTIDAD" },
  { value: "SELFIE", label: "Selfie / foto personal", category: "IDENTIDAD" },
  { value: "RECIBO_LUZ", label: "Recibo de electricidad", category: "DOMICILIO" },
  { value: "RECIBO_AGUA", label: "Recibo de agua", category: "DOMICILIO" },
  { value: "RECIBO_INTERNET", label: "Recibo de internet", category: "DOMICILIO" },
  {
    value: "RECIBO_TELEFONO",
    label: "Recibo de teléfono",
    category: "DOMICILIO",
  },
  {
    value: "CONTRATO_ALQUILER",
    label: "Contrato de alquiler",
    category: "DOMICILIO",
  },
  { value: "CARTA_TRABAJO", label: "Carta de trabajo", category: "INGRESOS" },
  {
    value: "COLILLA_PAGO",
    label: "Colilla / comprobante de pago",
    category: "INGRESOS",
  },
  {
    value: "ESTADO_CUENTA_BANCARIO",
    label: "Estado de cuenta bancario",
    category: "INGRESOS",
  },
  {
    value: "MATRICULA_VEHICULO",
    label: "Matrícula del vehículo",
    category: "VEHICULO",
  },
  { value: "POLIZA_SEGURO", label: "Póliza de seguro", category: "VEHICULO" },
  {
    value: "FOTO_VEHICULO_FRENTE",
    label: "Foto vehículo — frente",
    category: "VEHICULO",
  },
  {
    value: "FOTO_VEHICULO_TRASERA",
    label: "Foto vehículo — trasera",
    category: "VEHICULO",
  },
  {
    value: "FOTO_VEHICULO_LATERAL_IZQ",
    label: "Foto vehículo — lateral izq.",
    category: "VEHICULO",
  },
  {
    value: "FOTO_VEHICULO_LATERAL_DER",
    label: "Foto vehículo — lateral der.",
    category: "VEHICULO",
  },
  { value: "OTRO", label: "Otro documento", category: "OTRO" },
];

const MAX_BYTES = 10 * 1024 * 1024;
const EXT_RE = /\.(pdf|jpe?g|png|webp)$/i;

export interface DocumentUploaderProps {
  applicationId: string;
  onUploadSuccess: (doc: CreditDocument) => void;
  categoryFilter?: string;
}

export function DocumentUploader({
  applicationId,
  onUploadSuccess,
  categoryFilter,
}: DocumentUploaderProps) {
  const { tenantId: ctx } = useTenant();
  const tenantId = (ctx ?? "").trim();
  const options =
    categoryFilter && categoryFilter !== "OTRO"
      ? DOCUMENT_TYPES.filter((t) => t.category === categoryFilter)
      : DOCUMENT_TYPES;
  const [docType, setDocType] = useState(options[0]?.value ?? "OTRO");
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.length && !options.some((o) => o.value === docType)) {
      setDocType(options[0]!.value);
    }
  }, [categoryFilter, docType, options]);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  function onFileChange(f: File | null) {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreviewSrc(URL.createObjectURL(f));
    }
  }

  async function submit() {
    setError(null);
    if (!docType) {
      setError("Selecciona un tipo de documento.");
      return;
    }
    if (!file) {
      setError("Selecciona un archivo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("El archivo supera 10 MB.");
      return;
    }
    if (!EXT_RE.test(file.name)) {
      setError("Extensión no permitida (pdf, jpg, png, webp).");
      return;
    }
    if (!tenantId) {
      setError("Selecciona institución (tenant).");
      return;
    }

    setBusy(true);
    setProgress(0);
    const step = setInterval(() => {
      setProgress((p) => (p >= 95 ? p : p + 5));
    }, 100);

    try {
      const doc = await uploadDocument(
        tenantId,
        applicationId,
        file,
        docType
      );
      setProgress(100);
      setFile(null);
      onFileChange(null);
      setDocType(options[0]?.value ?? "OTRO");
      onUploadSuccess(doc);
    } catch (e) {
      setError(
        e instanceof CreditApiError ? e.message : "Error al subir el archivo."
      );
    } finally {
      clearInterval(step);
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h3 className="text-sm font-medium text-slate-200 m-0">
        Subir documento
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase text-slate-500 block mb-1">
            Tipo de documento
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-slate-200"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase text-slate-500 block mb-1">
            Archivo
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={busy}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-violet-600 file:px-2 file:py-1 file:text-white"
          />
        </div>
      </div>
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt="Vista previa"
          className="max-h-40 rounded border border-white/10"
        />
      ) : null}
      {busy ? (
        <div className="h-1.5 rounded bg-black/30 overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-400 m-0">{error}</p> : null}
      <button
        type="button"
        disabled={busy || !tenantId}
        onClick={() => void submit()}
        className="w-full rounded-lg bg-violet-600 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-40"
      >
        {busy ? "Subiendo…" : "Subir"}
      </button>
    </div>
  );
}
