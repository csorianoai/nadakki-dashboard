import type { TenantRequiredDocument } from "@/lib/credit-hub/types/tenantConfig";

/** Fallback when `tenantConfig.required_documents` is empty (multi-tenant: prefer tenant API). */
export const DEFAULT_DO_REQUIRED_DOCUMENTS: TenantRequiredDocument[] = [
  { key: "id_front", label: "Cédula (frente)", required: true, tooltip: "Foto clara de la cédula del solicitante" },
  { key: "id_back", label: "Cédula (reverso)", required: true, tooltip: "Foto clara del reverso de la cédula" },
  {
    key: "vehicle_documents",
    label: "Documentos del vehículo",
    required: true,
    tooltip: "Matrícula o título de propiedad del vehículo",
  },
  { key: "employment_letter", label: "Carta de empleo / constancia laboral", required: false },
  { key: "pay_stubs", label: "Últimas 3 nóminas o comprobantes de ingreso", required: false },
  { key: "bank_statements", label: "Estados de cuenta bancarios (últimos 3 meses)", required: false, tooltip: "Necesarios para análisis SIC" },
  { key: "tax_return", label: "Declaración de impuestos (si aplica)", required: false },
  { key: "address_proof", label: "Comprobante de domicilio", required: false, tooltip: "Factura de servicio público reciente" },
  { key: "other_documents", label: "Otros documentos relevantes", required: false },
];
