"use client";

import { PRESENT_TEXT_CLIENT_FIELDS, type PresentTextField, type PresentTextFields } from "@/lib/credit-hub/api/consent-client";

const LABELS: Record<PresentTextField, string> = {
  NOMBRE_TITULAR: "Nombre del titular",
  CEDULA: "Cédula del titular",
  NOMBRE_CONCESIONARIO: "Concesionario",
  VEHICULO: "Vehículo",
  LISTA_ENTIDADES: "Entidades financieras destinatarias",
  CONTACTO_DERECHOS: "Contacto para ejercer derechos",
  LUGAR: "Lugar",
  FECHA: "Fecha",
};

export function presentTextFieldsComplete(campos: PresentTextFields): boolean {
  return PRESENT_TEXT_CLIENT_FIELDS.every((k) => campos[k].trim().length > 0);
}

/** Datos con los que el backend rellena el texto oficial v1.0 antes de mostrarlo y firmarlo. */
export function PresentConsentDocumentFields({
  campos,
  onChange,
  onLoad,
  loading,
}: {
  campos: PresentTextFields;
  onChange: (key: PresentTextField, value: string) => void;
  onLoad: () => void;
  loading: boolean;
}) {
  const complete = presentTextFieldsComplete(campos);
  return (
    <fieldset className="mt-4 space-y-3 border-l-2 border-forge-primary/50 pl-6" data-testid="present-document-fields">
      <legend className="text-sm font-medium text-forge-text">Datos del documento de consentimiento</legend>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PRESENT_TEXT_CLIENT_FIELDS.map((key) => (
          <label key={key} className="space-y-1 text-xs text-forge-text-muted">
            <span>{LABELS[key]} *</span>
            <input
              type="text"
              value={campos[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="h-10 w-full rounded-lg border border-forge-border bg-forge-surface px-3 text-sm text-forge-text"
              data-testid={`present-field-${key}`}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={onLoad}
        disabled={!complete || loading}
        className="rounded-lg border border-forge-primary px-4 py-2 text-sm font-medium text-forge-primary disabled:cursor-not-allowed disabled:border-forge-border disabled:text-forge-text-muted"
        data-testid="present-load-text"
      >
        {loading ? "Cargando texto oficial…" : "Cargar texto oficial"}
      </button>
    </fieldset>
  );
}
