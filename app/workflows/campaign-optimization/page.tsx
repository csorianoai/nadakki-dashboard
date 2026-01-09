"use client";

import WorkflowExecutor from "@/components/workflows/WorkflowExecutor";

const WORKFLOW_CONFIG = {
  id: "campaign-optimization",
  name: "Campaign Optimization",
  description: "Optimiza campañas con IA predictiva, ajusta presupuestos y maximiza ROI automáticamente usando 5 agentes especializados.",
  icon: "📢",
  color: "#8b5cf6",
  tier: "CORE",
  agents: 5,
  estimatedTime: "~3s",
  inputs: [
    {
      id: "campaign_name",
      label: "Nombre de la Campaña",
      type: "text" as const,
      placeholder: "Ej: Black Friday 2025",
      defaultValue: "Test Campaign",
      required: true
    },
    {
      id: "objective",
      label: "Objetivo",
      type: "select" as const,
      options: [
        { value: "lead_generation", label: "Generación de Leads" },
        { value: "brand_awareness", label: "Reconocimiento de Marca" },
        { value: "conversions", label: "Conversiones" },
        { value: "engagement", label: "Engagement" },
        { value: "traffic", label: "Tráfico Web" }
      ],
      defaultValue: "lead_generation",
      required: true
    },
    {
      id: "channel",
      label: "Canal Principal",
      type: "select" as const,
      options: [
        { value: "email", label: "Email Marketing" },
        { value: "social", label: "Redes Sociales" },
        { value: "ads", label: "Publicidad Digital" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push Notifications" }
      ],
      defaultValue: "email",
      required: true
    },
    {
      id: "budget",
      label: "Presupuesto (USD)",
      type: "number" as const,
      placeholder: "10000",
      defaultValue: 10000,
      required: true
    },
    {
      id: "target_audience",
      label: "Audiencia Objetivo",
      type: "textarea" as const,
      placeholder: "Describe tu audiencia objetivo...",
      defaultValue: "Profesionales 25-45 años interesados en tecnología financiera",
      required: false
    }
  ]
};

export default function CampaignOptimizationPage() {
  return <WorkflowExecutor config={WORKFLOW_CONFIG} />;
}