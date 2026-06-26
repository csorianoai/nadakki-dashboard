// lib/legal-cockpit/demo-data.ts
// REGLA: todos los objetos tienen demoData: true — sin excepciones
// Solo se usan si backend no responde o en modo demo explícito

import type {
  LegalKPI,
  LegalUrgentMatter,
  LegalAgent,
  GoldenPathStep,
} from "./types";

export const DEMO_KPIS: LegalKPI[] = [
  {
    key: "active_cases",
    label: "Casos activos",
    value: 12,
    helper: "3 nuevos esta semana",
    severity: "neutral",
    demoData: true,
  },
  {
    key: "urgent_deadlines",
    label: "Plazos urgentes",
    value: 3,
    helper: "1 vence en 24h",
    severity: "danger",
    demoData: true,
  },
  {
    key: "pending_docs",
    label: "Docs pendientes",
    value: 7,
    helper: "Requieren análisis",
    severity: "warning",
    demoData: true,
  },
  {
    key: "daily_queries",
    label: "Consultas hoy",
    value: 18,
    helper: "Audit trail activo",
    severity: "success",
    demoData: true,
  },
];

export const DEMO_URGENT_MATTERS: LegalUrgentMatter[] = [
  {
    id: "crd-2026-041",
    caseNumber: "CRD-2026-041",
    title: "Cobro de Pesos",
    caseType: "defensa_civil_cobro_pesos",
    urgency: "critical",
    summary: "Plazo de contestación vence en 3 días — Art. 15 Ley 834",
    pendingTasks: [
      "Autenticar documentos notariales",
      "Analizar jurisprudencia de cobro ejecutivo",
    ],
    suggestions: [
      { text: "Calcular plazo exacto", actionKey: "calculate_deadline" },
      { text: "Analizar jurisprudencia", actionKey: "research_case_law" },
      { text: "Redactar contestación", actionKey: "draft_legal_document" },
    ],
    deadlineDays: 3,
    demoData: true,
  },
  {
    id: "crd-2026-038",
    caseNumber: "CRD-2026-038",
    title: "Contrato Inmobiliario",
    caseType: "contratos_inmobiliarios",
    urgency: "warning",
    summary: "Promesa de venta pendiente de análisis — Ley 189-11",
    pendingTasks: [
      "Verificar poder notarial del vendedor",
      "Revisar cumplimiento Ley 189-11",
    ],
    suggestions: [
      { text: "Analizar riesgo del contrato", actionKey: "analyze_contract" },
      { text: "Validar poder notarial", actionKey: "verify_power" },
    ],
    demoData: true,
  },
  {
    id: "crd-2026-035",
    caseNumber: "CRD-2026-035",
    title: "Caso Laboral",
    caseType: "defensa_laboral",
    urgency: "active",
    summary: "KYC del empleador pendiente — UAFD",
    pendingTasks: ["KYC del empleador (UAFD)", "Preparar contestación"],
    suggestions: [
      { text: "Verificar KYC/AML", actionKey: "aml_kyc" },
      { text: "Redactar contestación", actionKey: "draft_legal_document" },
    ],
    demoData: true,
  },
];

export const DEMO_GOLDEN_PATH: GoldenPathStep[] = [
  { step: 1, key: "create", label: "Crear expediente", status: "done", action: "/legal/cases/new" },
  { step: 2, key: "upload", label: "Subir documentos", status: "done", action: "/legal/cases" },
  { step: 3, key: "detect", label: "Detectar riesgos", status: "active", action: "/legal/research?agent=analizador_riesgo_clausulas" },
  { step: 4, key: "calculate", label: "Calcular plazos", status: "pending", action: "/legal/research?agent=calculador_plazos_procesales" },
  { step: 5, key: "strategy", label: "Generar estrategia", status: "pending", action: "/legal/research?agent=agente_estrategia_litigiosa" },
  { step: 6, key: "validate", label: "Validar citas", status: "pending", action: "/legal/research?agent=analizador_jurisprudencia" },
  { step: 7, key: "snapshot", label: "Snapshot SHA-256", status: "pending", action: "/legal/cases" },
];

// REGLA CRÍTICA: todos demoData: true
export const DEMO_AGENTS: LegalAgent[] = [
  {
    id: "analizador_contratos",
    name: "Analizador de contratos",
    category: "documentos",
    subtitle: "Documentos · Riesgo contractual · Código Civil RD",
    description:
      "Detecta cláusulas abusivas, vacíos legales e incumplimientos en contratos según el Código Civil dominicano.",
    estimatedSavings: "~85% ahorro estimado",
    status: "active",
    inputRequired: "PDF o texto del contrato",
    outputExpected: "Matriz de riesgo + cláusulas problemáticas + recomendaciones",
    certificationDate: "2026-01",
    demoData: true,
  },
  {
    id: "calculador_plazos_procesales",
    name: "Calculador de plazos",
    category: "plazos",
    subtitle: "Plazos · Prescripción · CPC · Ley 834",
    description:
      "Calcula plazos procesales, prescripción y fechas críticas según el Código de Procedimiento Civil dominicano.",
    estimatedSavings: "~95% ahorro estimado",
    status: "active",
    inputRequired: "Tipo de acción, fecha del acto, jurisdicción",
    outputExpected: "Plazo exacto + fecha de vencimiento + artículo aplicable",
    certificationDate: "2026-01",
    demoData: true,
  },
  {
    id: "validador_amlkyc",
    name: "Validador AML / KYC",
    category: "compliance",
    subtitle: "Compliance · Ley 155-17 · UAFD",
    description:
      "Verifica cumplimiento de la Ley 155-17 sobre lavado de activos. Identifica señales de alerta.",
    estimatedSavings: "~80% ahorro estimado",
    status: "active",
    inputRequired: "Datos del cliente, actividad económica",
    outputExpected: "Informe KYC + señales de alerta + nivel de riesgo",
    certificationDate: "2026-01",
    demoData: true,
  },
  {
    id: "analizador_jurisprudencia",
    name: "Analizador de jurisprudencia",
    category: "investigacion",
    subtitle: "Investigación · Precedentes · SCJ",
    description:
      "Busca y sintetiza jurisprudencia relevante del sistema judicial dominicano con citas verificadas SHA-256.",
    estimatedSavings: "~90% ahorro estimado",
    status: "active",
    inputRequired: "Tema jurídico, tipo de caso",
    outputExpected: "Sentencias + síntesis doctrinal + citas verificadas",
    certificationDate: "2026-01",
    demoData: true,
  },
  {
    id: "agente_estrategia_litigiosa",
    name: "Estratega litigioso",
    category: "litigio",
    subtitle: "Litigio · Estrategia procesal",
    description:
      "Analiza el expediente y sugiere estrategia procesal óptima con evaluación de probabilidad de éxito.",
    estimatedSavings: "~70% ahorro estimado",
    status: "active",
    inputRequired: "Expediente completo, tipo de caso",
    outputExpected: "Estrategia procesal + excepciones + evaluación de riesgo",
    certificationDate: "2026-01",
    demoData: true,
  },
  {
    id: "redactor_escritos",
    name: "Redactor de escritos",
    category: "documentos",
    subtitle: "Documentos · Escritos procesales",
    description:
      "Redacta demandas, contestaciones, apelaciones y recursos adaptados al sistema judicial dominicano.",
    estimatedSavings: "~80% ahorro estimado",
    status: "active",
    inputRequired: "Tipo de escrito, hechos del caso, tribunal",
    outputExpected: "Escrito completo con formato correcto",
    certificationDate: "2026-01",
    demoData: true,
  },
];
