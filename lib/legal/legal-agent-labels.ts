/**
 * Nombre visible, en español con tildes, de lo que produjo cada agente legal.
 * Clave: agent_id del backend (services/legal/legal_agent_catalog.py).
 * Se describe el resultado ("Plantilla generada"), no el agente interno.
 */
const LEGAL_RESULT_LABELS: Record<string, string> = {
  chat_asesor_legal: "Consulta jurídica respondida",
  analizador_contratos: "Análisis de contrato",
  analizador_riesgo_contractual: "Análisis de riesgo contractual",
  analizador_jurisprudencia: "Análisis de jurisprudencia",
  extractor_clausulas: "Cláusulas extraídas",
  extractor_citas: "Citas legales extraídas",
  comparador_documentos: "Comparación de documentos",
  redactor_contratos: "Borrador de contrato",
  redactor_escritos: "Borrador de escrito procesal",
  generador_plantillas: "Documento generado desde plantilla",
  clasificador_documentos: "Documentos clasificados",
  agente_orquestador_legal: "Consulta jurídica coordinada",
  agente_aml_kyc: "Verificación AML/KYC",
  validador_amlkyc: "Verificación AML/KYC",
  agente_proteccion_consumidor: "Análisis de protección al consumidor",
  agente_proteccion_datos: "Revisión de protección de datos",
  agente_opinion_legal: "Opinión legal",
  agente_memo_riesgo: "Memorando de riesgo",
  agente_estrategia_litigiosa: "Estrategia litigiosa",
  monitor_regulatorio: "Revisión regulatoria",
  agente_investigacion_legal: "Investigación jurídica",
  agente_linea_tiempo_casos: "Línea de tiempo del caso",
  parser_ocr_legal: "Documento digitalizado",
  validador_firmas: "Validación de firmas",
  organizador_evidencias: "Pruebas organizadas",
  calculador_plazos_procesales: "Cálculo de plazo procesal",
  validador_citas_legales: "Verificación de citas",
  verificador_prescripcion: "Verificación de prescripción",
  agente_auditoria: "Auditoría de trazabilidad",
  agente_enrutamiento: "Consulta enrutada",
};

/** Etiqueta legible; para un id desconocido, el id sin guiones bajos y con mayúscula inicial. */
export function legalResultLabel(agentId: string | null | undefined): string {
  const id = (agentId ?? "").trim();
  if (!id) return "Resultado de IA";
  const known = LEGAL_RESULT_LABELS[id];
  if (known) return known;
  const plain = id.replaceAll("_", " ");
  return plain.charAt(0).toUpperCase() + plain.slice(1);
}
