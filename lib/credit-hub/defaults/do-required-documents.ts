import type { TenantRequiredDocument } from "@/lib/credit-hub/types/tenantConfig";

/** Fallback when `tenantConfig.required_documents` is empty (multi-tenant: prefer tenant API). */
export const DEFAULT_DO_REQUIRED_DOCUMENTS: TenantRequiredDocument[] = [
  { key: "id_front", label: "Cédula (frente)", required: true, tooltip: "Foto clara de la cédula del solicitante" },
  { key: "id_back", label: "Cédula (reverso)", required: false },
  { key: "employment_letter", label: "Carta de trabajo o constancia laboral", required: false },
  { key: "bank_statements", label: "Últimos 3 estados de cuenta bancarios", required: false, tooltip: "Necesarios para análisis SIC" },
  { key: "income_evidence", label: "Evidencia de ingresos adicionales", required: false, tooltip: "Solo si aplica" },
  { key: "address_proof", label: "Comprobante de domicilio", required: false, tooltip: "Factura de servicio público reciente" },
  { key: "vehicle_documents", label: "Documentos del vehículo", required: false, tooltip: "Matrícula si es usado" },
  { key: "other_documents", label: "Otros documentos relevantes", required: false },
];
