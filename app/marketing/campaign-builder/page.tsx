"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileEdit, Calendar, Users, Eye, Send, CheckCircle, 
  ArrowLeft, ArrowRight, Save, Sparkles, Target, Mail,
  MessageSquare, Bell, Smartphone, Loader2
} from "lucide-react";
import Link from "next/link";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

const API_URL = "https://nadakki-ai-suite.onrender.com";

const STEPS = [
  { id: "compose", label: "Compose", icon: FileEdit, description: "Define tu mensaje" },
  { id: "schedule", label: "Schedule", icon: Calendar, description: "Programa el envio" },
  { id: "target", label: "Target", icon: Users, description: "Selecciona audiencia" },
  { id: "review", label: "Review", icon: Eye, description: "Revisa y confirma" },
];

const CHANNELS = [
  { id: "email", name: "Email", icon: Mail, color: "#3b82f6" },
  { id: "sms", name: "SMS", icon: MessageSquare, color: "#22c55e" },
  { id: "push", name: "Push", icon: Bell, color: "#f59e0b" },
  { id: "in-app", name: "In-App", icon: Smartphone, color: "#8b5cf6" },
];

const SEGMENTS = [
  { id: "all", name: "Todos los usuarios", desc: "Enviar a toda la base de datos", count: "12,450" },
  { id: "active", name: "Usuarios activos", desc: "Usuarios con actividad en los ultimos 30 dias", count: "8,230" },
  { id: "leads", name: "Leads calientes", desc: "Leads con score mayor a 70", count: "1,850" },
  { id: "inactive", name: "Usuarios inactivos", desc: "Sin actividad en 60+ dias", count: "2,340" },
];

export default function CampaignBuilderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaign, setCampaign] = useState({
    name: "",
    channel: "email",
    subject: "",
    content: "",
    schedule: "now",
    scheduleDate: "",
    segment: "all"
  });
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updateCampaign = (field: string, value: string) => {
    setCampaign(prev => ({ ...prev, [field]: value }));
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      // Llamar al agente de contenido del backend
      const res = await fetch(API_URL + "/execute/marketing/contentgeneratoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_data: { topic: campaign.name || "promocion", channel: campaign.channel },
          tenant_id: "credicefi"
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCampaign(prev => ({
          ...prev,
          subject: "Descubre las nuevas funciones de IA que transformaran tu negocio",
          content: data.result?.content || "Hola {nombre},\n\nQueremos presentarte las ultimas innovaciones en nuestra plataforma de IA que te ayudaran a automatizar tus procesos y aumentar tu productividad.\n\n- Nuevos agentes de marketing\n- Analisis predictivo mejorado\n- Integracion con redes sociales\n\nNo te pierdas esta oportunidad de llevar tu negocio al siguiente nivel.\n\nSaludos,\nEl equipo de NADAKKI"
        }));
      } else {
        // Fallback si el agente no responde
        setCampaign(prev => ({
          ...prev,
          subject: "Descubre las nuevas funciones de IA que transformaran tu negocio",
          content: "Hola {nombre},\n\nQueremos presentarte las ultimas innovaciones en nuestra plataforma de IA.\n\n- Nuevos agentes de marketing automatizado\n- Analisis predictivo mejorado\n- Integracion completa con redes sociales\n\nNo te pierdas esta oportunidad.\n\nSaludos,\nEl equipo de NADAKKI"
        }));
      }
    } catch (err) {
      console.error("Error generando contenido:", err);
      setCampaign(prev => ({
        ...prev,
        subject: "Oferta especial para ti",
        content: "Hola {nombre},\n\nTenemos una oferta especial que no puedes perderte.\n\nSaludos,\nEl equipo"
      }));
    } finally {
      setGenerating(false);
    }
  };

  const launchCampaign = async () => {
    setLaunching(true);
    setResult(null);
    
    try {
      const res = await fetch(API_URL + "/api/campaigns?tenant_id=credicefi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaign.name,
          channel: campaign.channel,
          subject: campaign.subject,
          content: campaign.content,
          schedule: campaign.schedule,
          schedule_date: campaign.schedule === "scheduled" ? campaign.scheduleDate : null,
          segment: campaign.segment
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({ success: true, campaign: data.campaign, message: data.message });
      } else {
        setResult({ success: false, error: data.detail || "Error creando campaña" });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || "Error de conexion" });
    } finally {
      setLaunching(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return campaign.name && campaign.channel && campaign.content;
      case 1: return campaign.schedule === "now" || campaign.scheduleDate;
      case 2: return campaign.segment;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Campana *</label>
              <input type="text" value={campaign.name} onChange={(e) => updateCampaign("name", e.target.value)}
                placeholder="Ej: Promocion de Verano 2026"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Canal de Envio *</label>
              <div className="grid grid-cols-4 gap-3">
                {CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => updateCampaign("channel", ch.id)}
                    className={"p-4 rounded-xl border transition-all flex flex-col items-center gap-2 " + 
                      (campaign.channel === ch.id ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                    <ch.icon className="w-6 h-6" style={{ color: ch.color }} />
                    <span className="text-sm text-white">{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {campaign.channel === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Asunto del Email</label>
                <input type="text" value={campaign.subject} onChange={(e) => updateCampaign("subject", e.target.value)}
                  placeholder="Asunto atractivo para tu email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none" />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Contenido del Mensaje *</label>
                <button onClick={generateWithAI} disabled={generating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "Generando..." : "Generar con IA"}
                </button>
              </div>
              <textarea value={campaign.content} onChange={(e) => updateCampaign("content", e.target.value)}
                placeholder="Escribe tu mensaje o usa IA para generarlo..."
                rows={8}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Cuando enviar la campana?</label>
              <div className="space-y-3">
                {[
                  { id: "now", title: "Enviar ahora", desc: "La campana se enviara inmediatamente" },
                  { id: "scheduled", title: "Programar para despues", desc: "Selecciona fecha y hora" }
                ].map(opt => (
                  <label key={opt.id} className={"flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all " +
                    (campaign.schedule === opt.id ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                    <input type="radio" name="schedule" value={opt.id} checked={campaign.schedule === opt.id}
                      onChange={(e) => updateCampaign("schedule", e.target.value)} className="hidden" />
                    <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center " +
                      (campaign.schedule === opt.id ? "border-purple-500" : "border-gray-500")}>
                      {campaign.schedule === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{opt.title}</p>
                      <p className="text-sm text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {campaign.schedule === "scheduled" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fecha y Hora</label>
                <input type="datetime-local" value={campaign.scheduleDate}
                  onChange={(e) => updateCampaign("scheduleDate", e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none" />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">Selecciona tu audiencia</label>
              <div className="space-y-3">
                {SEGMENTS.map(seg => (
                  <label key={seg.id} className={"flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all " +
                    (campaign.segment === seg.id ? "border-purple-500 bg-purple-500/20" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                    <input type="radio" name="segment" value={seg.id} checked={campaign.segment === seg.id}
                      onChange={(e) => updateCampaign("segment", e.target.value)} className="hidden" />
                    <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center " +
                      (campaign.segment === seg.id ? "border-purple-500" : "border-gray-500")}>
                      {campaign.segment === seg.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{seg.name}</p>
                      <p className="text-sm text-gray-400">{seg.desc}</p>
                    </div>
                    <span className="text-sm text-gray-500">{seg.count}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {result ? (
              <div className={"p-6 rounded-xl border " + (result.success ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
                <div className="flex items-center gap-3 mb-4">
                  {result.success ? <CheckCircle className="w-8 h-8 text-green-400" /> : <span className="text-3xl">❌</span>}
                  <h3 className={"text-xl font-bold " + (result.success ? "text-green-400" : "text-red-400")}>
                    {result.success ? "Campana Lanzada!" : "Error"}
                  </h3>
                </div>
                {result.success ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">ID: <span className="text-white font-mono">{result.campaign.id}</span></p>
                    <p className="text-gray-300">Estado: <span className="text-white">{result.campaign.status}</span></p>
                    <p className="text-gray-300">Audiencia: <span className="text-white">{result.campaign.stats.total.toLocaleString()} usuarios</span></p>
                    {result.campaign.status === "sent" && (
                      <>
                        <p className="text-gray-300">Enviados: <span className="text-green-400">{result.campaign.stats.sent.toLocaleString()}</span></p>
                        <p className="text-gray-300">Entregados: <span className="text-green-400">{result.campaign.stats.delivered.toLocaleString()}</span></p>
                      </>
                    )}
                    <Link href="/marketing/campaigns" className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">
                      Ver todas las campanas →
                    </Link>
                  </div>
                ) : (
                  <p className="text-red-300">{result.error}</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <GlassCard className="p-5">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Detalles</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Nombre:</span><span className="text-white">{campaign.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Canal:</span><span className="text-white capitalize">{campaign.channel}</span></div>
                      {campaign.subject && <div className="flex justify-between"><span className="text-gray-400">Asunto:</span><span className="text-white truncate max-w-[180px]">{campaign.subject}</span></div>}
                    </div>
                  </GlassCard>
                  <GlassCard className="p-5">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Programacion</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Envio:</span><span className="text-white">{campaign.schedule === "now" ? "Inmediato" : campaign.scheduleDate}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Segmento:</span><span className="text-white capitalize">{campaign.segment}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Audiencia:</span><span className="text-white">{SEGMENTS.find(s => s.id === campaign.segment)?.count}</span></div>
                    </div>
                  </GlassCard>
                </div>
                <GlassCard className="p-5">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Vista Previa</h4>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{campaign.content}</pre>
                  </div>
                </GlassCard>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="active" label="Campaign Builder" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Campaign Builder</h1>
            <p className="text-gray-400">Crea campanas multicanal con IA</p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-8 px-4">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button onClick={() => !result && index <= currentStep && setCurrentStep(index)}
              disabled={!!result}
              className={"flex items-center gap-3 px-4 py-2 rounded-xl transition-all " +
                (index === currentStep ? "bg-purple-500 text-white" : 
                 index < currentStep ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-500")}>
              {index < currentStep ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              <span className="font-medium">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && <div className={"w-16 h-0.5 mx-2 " + (index < currentStep ? "bg-green-500" : "bg-white/10")} />}
          </div>
        ))}
      </div>

      <GlassCard className="p-8 mb-6">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </GlassCard>

      {!result && (
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 disabled:opacity-50 transition-all">
            <ArrowLeft className="w-5 h-5" /> Atras
          </button>
          <div className="flex items-center gap-3">
            {currentStep < STEPS.length - 1 ? (
              <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium disabled:opacity-50 transition-all">
                Siguiente <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={launchCampaign} disabled={!canProceed() || launching}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-white font-bold disabled:opacity-50 transition-all">
                {launching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {launching ? "Lanzando..." : "Lanzar Campana"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
