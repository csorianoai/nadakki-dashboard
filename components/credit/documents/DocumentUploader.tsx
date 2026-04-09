"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import {
  CreditApiError,
  uploadDocument,
  type CreditDocument,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";

type DocGroup = {
  category: string;
  label: string;
  options: { value: string; label: string }[];
};

const DOCUMENT_GROUPS: DocGroup[] = [
  {
    category: "IDENTIDAD",
    label: "Identidad",
    options: [
      { value: "CEDULA_FRENTE", label: "Cédula — frente" },
      { value: "CEDULA_REVERSO", label: "Cédula — reverso" },
      { value: "SELFIE", label: "Selfie / foto personal" },
      { value: "PASAPORTE", label: "Pasaporte" },
    ],
  },
  {
    category: "DOMICILIO",
    label: "Domicilio",
    options: [
      { value: "RECIBO_LUZ", label: "Recibo de electricidad" },
      { value: "RECIBO_AGUA", label: "Recibo de agua" },
      { value: "RECIBO_INTERNET", label: "Recibo de internet" },
      { value: "RECIBO_TELEFONO", label: "Recibo de teléfono" },
      { value: "CONTRATO_ALQUILER", label: "Contrato de alquiler" },
    ],
  },
  {
    category: "INGRESOS",
    label: "Ingresos",
    options: [
      { value: "CARTA_TRABAJO", label: "Carta de trabajo" },
      { value: "COLILLA_PAGO", label: "Colilla / comprobante de pago" },
      { value: "ESTADO_CUENTA_BANCARIO", label: "Estado de cuenta bancario" },
      {
        value: "DECLARACION_IMPUESTOS",
        label: "Declaración de impuestos",
      },
    ],
  },
  {
    category: "VEHICULO",
    label: "Vehículo",
    options: [
      { value: "MATRICULA_VEHICULO", label: "Matrícula del vehículo" },
      { value: "POLIZA_SEGURO", label: "Póliza de seguro" },
      { value: "FOTO_VEHICULO_FRENTE", label: "Foto vehículo — frente" },
      { value: "FOTO_VEHICULO_TRASERA", label: "Foto vehículo — trasera" },
      { value: "FOTO_VEHICULO_LATERAL_IZQ", label: "Foto vehículo — lateral izq." },
      { value: "FOTO_VEHICULO_LATERAL_DER", label: "Foto vehículo — lateral der." },
    ],
  },
  {
    category: "OTRO",
    label: "Otros",
    options: [{ value: "OTRO", label: "Otro documento" }],
  },
];

const DOC_TYPE_DESCRIPTION: Record<string, string> = {
  CEDULA_FRENTE:
    "Fotografía nítida del anverso de la cédula; debe verse el número y la foto.",
  CEDULA_REVERSO:
    "Reverso de la cédula con domicilio y datos legibles.",
  SELFIE:
    "Foto reciente del solicitante para validación de identidad.",
  PASAPORTE:
    "Página principal del pasaporte vigente, si aplica en lugar de cédula.",
  RECIBO_LUZ:
    "Recibo reciente de electricidad a nombre del solicitante o del domicilio declarado.",
  RECIBO_AGUA:
    "Recibo de agua potable que acredite el domicilio.",
  RECIBO_INTERNET:
    "Factura o recibo de servicio de internet/cable en el domicilio.",
  RECIBO_TELEFONO:
    "Recibo de línea fija o móvil asociado al domicilio o titularidad.",
  CONTRATO_ALQUILER:
    "Contrato firmado o constancia de arrendamiento del inmueble.",
  CARTA_TRABAJO:
    "Carta de la empresa con cargo, antigüedad e ingresos, firmada y sellada si aplica.",
  COLILLA_PAGO:
    "Comprobante de nómina o pago que respalde ingresos declarados.",
  ESTADO_CUENTA_BANCARIO:
    "Extracto que muestre flujo o saldos relevantes (últimos meses).",
  DECLARACION_IMPUESTOS:
    "Declaración DGII u otra normativa aplicable para ingresos independientes.",
  MATRICULA_VEHICULO:
    "Registro o matrícula del vehículo con datos del titular y placa.",
  POLIZA_SEGURO:
    "Póliza vigente o endoso del vehículo a financiar.",
  FOTO_VEHICULO_FRENTE:
    "Foto frontal clara del vehículo, idealmente con placa visible.",
  FOTO_VEHICULO_TRASERA:
    "Foto trasera que muestre condición general del vehículo.",
  FOTO_VEHICULO_LATERAL_IZQ:
    "Vista lateral izquierda para inspección de carrocería.",
  FOTO_VEHICULO_LATERAL_DER:
    "Vista lateral derecha para inspección de carrocería.",
  OTRO: "Documento adicional que complemente el expediente.",
};

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

  const groups = useMemo(() => {
    if (!categoryFilter || categoryFilter === "OTRO") {
      return DOCUMENT_GROUPS;
    }
    return DOCUMENT_GROUPS.filter((g) => g.category === categoryFilter);
  }, [categoryFilter]);

  const flatOptions = useMemo(
    () => groups.flatMap((g) => g.options),
    [groups]
  );

  const [docType, setDocType] = useState(flatOptions[0]?.value ?? "OTRO");
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (
      flatOptions.length &&
      !flatOptions.some((o) => o.value === docType)
    ) {
      setDocType(flatOptions[0]!.value);
    }
  }, [categoryFilter, docType, flatOptions]);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  const onFileChange = useCallback((f: File | null) => {
    setPreviewSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      setPreviewSrc(URL.createObjectURL(f));
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!busy) setDragActive(true);
  }, [busy]);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (busy) return;
      const f = e.dataTransfer.files?.[0] ?? null;
      if (f) onFileChange(f);
    },
    [busy, onFileChange]
  );

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
      setDocType(flatOptions[0]?.value ?? "OTRO");
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

  const selectedGroupLabel =
    groups.find((g) => g.options.some((o) => o.value === docType))?.label ??
    null;
  const typeDescription = DOC_TYPE_DESCRIPTION[docType];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <h3 className="text-sm font-medium text-slate-200 m-0">
        Subir documento
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Tipo de documento
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
          >
            {groups.map((g) => (
              <optgroup key={g.category} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {typeDescription ? (
            <p className="text-xs text-slate-500 mt-2 m-0">
              <span className="text-slate-400 font-medium">
                {selectedGroupLabel ? `${selectedGroupLabel}: ` : ""}
              </span>
              {typeDescription}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Archivo
          </label>
          <label
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center w-full min-h-24 rounded-lg border-2 border-dashed cursor-pointer transition-colors px-3 py-4 ${
              dragActive
                ? "border-violet-500/70 bg-violet-500/10"
                : "border-white/20 bg-white/3 hover:border-violet-500/50 hover:bg-white/5"
            } ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="text-sm text-slate-400 text-center">
              {file ? (
                <span className="text-violet-400 font-medium break-all">
                  {file.name}
                </span>
              ) : (
                <>
                  <span className="text-violet-400">Haz clic para seleccionar</span>
                  {" "}o arrastra el archivo aquí
                </>
              )}
            </span>
            <span className="text-xs text-slate-600 mt-1">
              PDF, JPG, PNG, WEBP — máximo 10 MB
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={busy}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
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
