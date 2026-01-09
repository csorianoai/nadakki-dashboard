"use client";

import WorkflowExecutor from "@/components/workflows/WorkflowExecutor";

const WORKFLOW_CONFIG = {
  id: "email-automation-master",
  name: "Email Automation Master",
  description: "Automatización avanzada de email marketing con personalización dinámica y A/B testing.",
  icon: "✉️",
  color: "#06b6d4",
  tier: "EXECUTION",
  agents: 4,
  estimatedTime: "~3s",
  inputs: [
    {
      id: "campaign_name",
      label: "Nombre de la Campaña",
      type: "text" as const,
      placeholder: "Ej: Q1 Campaign 2025",
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
        { value: "retention", label: "Retención" }
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
        { value: "multichannel", label: "Multi-Canal" }
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
      defaultValue: "",
      required: false
    }
  ]
};

export default function WorkflowPage() {
  return <WorkflowExecutor config={WORKFLOW_CONFIG} />;
}
