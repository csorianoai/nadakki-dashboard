# Script para actualizar todos los workflows

$workflows = @(
    @{
        id = "customer-acquisition-intelligence"
        name = "Customer Acquisition Intelligence"
        desc = "Identifica y adquiere clientes de alto valor con scoring predictivo y segmentación avanzada."
        icon = "🎯"
        color = "#22c55e"
        tier = "CORE"
        agents = 7
        time = "~5s"
    },
    @{
        id = "customer-lifecycle-revenue"
        name = "Customer Lifecycle Revenue"
        desc = "Maximiza el valor del cliente en cada etapa del ciclo de vida con automatización inteligente."
        icon = "📈"
        color = "#f59e0b"
        tier = "CORE"
        agents = 6
        time = "~4s"
    },
    @{
        id = "content-performance-engine"
        name = "Content Performance Engine"
        desc = "Analiza y optimiza el rendimiento de contenido con métricas de engagement en tiempo real."
        icon = "📊"
        color = "#3b82f6"
        tier = "EXECUTION"
        agents = 5
        time = "~3s"
    },
    @{
        id = "social-media-intelligence"
        name = "Social Media Intelligence"
        desc = "Monitorea redes sociales, analiza sentimiento y detecta oportunidades de engagement."
        icon = "📱"
        color = "#ec4899"
        tier = "EXECUTION"
        agents = 4
        time = "~3s"
    },
    @{
        id = "email-automation-master"
        name = "Email Automation Master"
        desc = "Automatización avanzada de email marketing con personalización dinámica y A/B testing."
        icon = "✉️"
        color = "#06b6d4"
        tier = "EXECUTION"
        agents = 4
        time = "~3s"
    },
    @{
        id = "multi-channel-attribution"
        name = "Multi-Channel Attribution"
        desc = "Atribución multi-canal precisa para entender el journey completo del cliente."
        icon = "🎯"
        color = "#a855f7"
        tier = "INTELLIGENCE"
        agents = 4
        time = "~4s"
    },
    @{
        id = "competitive-intelligence-hub"
        name = "Competitive Intelligence Hub"
        desc = "Monitorea competidores, analiza estrategias y detecta oportunidades de mercado."
        icon = "🔍"
        color = "#ef4444"
        tier = "INTELLIGENCE"
        agents = 3
        time = "~3s"
    },
    @{
        id = "ab-testing-experimentation"
        name = "A/B Testing & Experimentation"
        desc = "Experimenta con variantes, mide resultados y optimiza conversiones científicamente."
        icon = "🧪"
        color = "#14b8a6"
        tier = "INTELLIGENCE"
        agents = 3
        time = "~3s"
    },
    @{
        id = "influencer-partnership-engine"
        name = "Influencer & Partnership Engine"
        desc = "Identifica influencers, gestiona partnerships y mide ROI de colaboraciones."
        icon = "⭐"
        color = "#f97316"
        tier = "INTELLIGENCE"
        agents = 2
        time = "~2s"
    }
)

foreach ($wf in $workflows) {
    $content = @"
"use client";

import WorkflowExecutor from "@/components/workflows/WorkflowExecutor";

const WORKFLOW_CONFIG = {
  id: "$($wf.id)",
  name: "$($wf.name)",
  description: "$($wf.desc)",
  icon: "$($wf.icon)",
  color: "$($wf.color)",
  tier: "$($wf.tier)",
  agents: $($wf.agents),
  estimatedTime: "$($wf.time)",
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
"@

    $path = "app\workflows\$($wf.id)\page.tsx"
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "✅ Actualizado: $($wf.id)" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Todos los workflows actualizados!" -ForegroundColor Cyan