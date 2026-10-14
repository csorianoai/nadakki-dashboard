import type { OperationDoc, Template } from "./types";

/** Datos sintéticos: prefijo SYNTH. Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". Ninguna plantilla trae visto bueno del abogado. */
export const DEMO_DOCS: readonly OperationDoc[] = [
  { id: "d1", name: "SYNTH Contrato de arrendamiento", operation: { es: "Alquiler · operación 1", en: "Rental · operation 1" }, status: "borrador" },
  { id: "d2", name: "SYNTH Oferta de compra", operation: { es: "Compra · operación 2", en: "Purchase · operation 2" }, status: "enviado" },
  { id: "d3", name: "SYNTH Acuerdo de listado", operation: { es: "Venta · operación 3", en: "Sale · operation 3" }, status: "firmado" },
];

export const DEMO_TEMPLATES: readonly Template[] = [
  { id: "t1", name: "SYNTH Plantilla de arrendamiento", kind: { es: "Alquiler", en: "Rental" }, lawyerApproval: null },
  { id: "t2", name: "SYNTH Plantilla de oferta de compra", kind: { es: "Compra", en: "Purchase" }, lawyerApproval: null },
];
