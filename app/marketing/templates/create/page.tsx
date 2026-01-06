"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Wand2, Sparkles, ArrowLeft, ArrowRight, Check, Copy,
  Mail, MessageSquare, Bell, Smartphone, MessageCircle, Globe,
  Target, Users, ShoppingCart, TrendingUp, Shield, Zap,
  Loader2, RefreshCw, Download, Save, Eye, ChevronRight, Home,
  Lightbulb, Palette, Type, Image, Layout, Send
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";

// Pasos del wizard
const steps = [
  { id: 1, name: "Objetivo", icon: Target },
  { id: 2, name: "Canal", icon: Mail },
  { id: 3, name: "Audiencia", icon: Users },
  { id: 4, name: "Contenido", icon: Type },
  { id: 5, name: "Generar", icon: Wand2 },
];

// Objetivos
const objectives = [
  { id: "convert", name: "Convertir Leads", icon: "🎯", description: "Transforma prospectos en clientes pagos", color: "from-green-500 to-emerald-500" },
  { id: "recover", name: "Recuperar Carritos", icon: "🛒", description: "Reduce abandono y recupera ventas perdidas", color: "from-orange-500 to-amber-500" },
  { id: "reactivate", name: "Reactivar Usuarios", icon: "💤", description: "Re-engancha usuarios dormidos o inactivos", color: "from-purple-500 to-violet-500" },
  { id: "retain", name: "Retener Clientes", icon: "🛡️", description: "Reduce churn y aumenta lealtad", color: "from-red-500 to-pink-500" },
  { id: "upsell", name: "Upsell / Cross-sell", icon: "📈", description: "Aumenta valor de cliente existente", color: "from-blue-500 to-cyan-500" },
  { id: "onboard", name: "Onboarding", icon: "👋", description: "Guía y activa nuevos usuarios", color: "from-teal-500 to-green-500" },
  { id: "inform", name: "Informar / Educar", icon: "📚", description: "Comparte conocimiento y valor", color: "from-indigo-500 to-purple-500" },
  { id: "feedback", name: "Obtener Feedback", icon: "💬", description: "Recolecta opiniones y NPS", color: "from-yellow-500 to-orange-500" },
];

// Canales
const channels = [
  { id: "email", name: "Email", icon: Mail, description: "Newsletters, campañas, transaccionales" },
  { id: "sms", name: "SMS", icon: MessageSquare, description: "Mensajes cortos y directos" },
  { id: "push", name: "Push Notification", icon: Bell, description: "Notificaciones móviles/web" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, description: "Mensajería conversacional" },
  { id: "in-app", name: "In-App Message", icon: Smartphone, description: "Modals, banners, tooltips" },
  { id: "landing", name: "Landing Page", icon: Globe, description: "Páginas de aterrizaje" },
];

// Tonos
const tones = [
  { id: "professional", name: "Profesional", emoji: "👔", description: "Formal y corporativo" },
  { id: "friendly", name: "Amigable", emoji: "😊", description: "Cercano y cálido" },
  { id: "urgent", name: "Urgente", emoji: "⚡", description: "Crea sensación de escasez" },
  { id: "casual", name: "Casual", emoji: "🤙", description: "Relajado e informal" },
  { id: "inspirational", name: "Inspiracional", emoji: "✨", description: "Motivador y aspiracional" },
  { id: "educational", name: "Educativo", emoji: "🎓", description: "Informativo y didáctico" },
];

// Industrias
const industries = [
  { id: "fintech", name: "Fintech", emoji: "🏦" },
  { id: "ecommerce", name: "E-commerce", emoji: "🛍️" },
  { id: "saas", name: "SaaS", emoji: "💻" },
  { id: "healthcare", name: "Healthcare", emoji: "🏥" },
  { id: "realestate", name: "Real Estate", emoji: "🏠" },
  { id: "education", name: "Educación", emoji: "🎓" },
  { id: "travel", name: "Viajes", emoji: "✈️" },
  { id: "food", name: "Food & Delivery", emoji: "🍕" },
];

export default function CreateTemplatePage() {
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    objective: "",
    channel: "",
    industry: "",
    tone: "",
    audienceDescription: "",
    productDescription: "",
    keyMessage: "",
    cta: "",
    additionalContext: "",
  });

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textSecondary = isLight ? "#475569" : theme?.colors?.textSecondary || "#94a3b8";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.objective;
      case 2: return !!formData.channel;
      case 3: return !!formData.industry && !!formData.tone;
      case 4: return !!formData.keyMessage;
      default: return true;
    }
  };

  const generateTemplate = async () => {
    setIsGenerating(true);
    // Simular generación con IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const objective = objectives.find(o => o.id === formData.objective);
    const channel = channels.find(c => c.id === formData.channel);
    const tone = tones.find(t => t.id === formData.tone);
    
    setGeneratedContent({
      subject: `${objective?.icon} ${formData.keyMessage || "Tu mensaje personalizado"}`,
      preheader: "Descubre lo que tenemos preparado para ti...",
      headline: formData.keyMessage || "Mensaje principal generado por IA",
      body: `Hola {{nombre}},\n\n${formData.additionalContext || "Contenido generado basado en tu descripción y objetivos..."}\n\nEste mensaje ha sido optimizado para ${formData.industry} con un tono ${tone?.name.toLowerCase()}.`,
      cta: formData.cta || "Descubrir más",
      footer: "© 2026 Tu Empresa. Todos los derechos reservados.",
      metadata: {
        predictedCTR: (Math.random() * 10 + 15).toFixed(1),
        predictedConversion: (Math.random() * 5 + 5).toFixed(1),
        readingTime: "2 min",
        wordCount: 150,
      }
    });
    setIsGenerating(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>¿Cuál es tu objetivo?</h2>
            <p className="mb-6" style={{ color: textMuted }}>Selecciona el objetivo principal de tu comunicación</p>
            <div className="grid grid-cols-2 gap-4">
              {objectives.map((obj) => (
                <motion.button
                  key={obj.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateForm("objective", obj.id)}
                  className="p-5 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: formData.objective === obj.id ? `${accentPrimary}15` : isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                    border: `2px solid ${formData.objective === obj.id ? accentPrimary : borderColor}`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{obj.icon}</span>
                    <div>
                      <div className="font-semibold" style={{ color: textPrimary }}>{obj.name}</div>
                      <div className="text-sm mt-1" style={{ color: textMuted }}>{obj.description}</div>
                    </div>
                    {formData.objective === obj.id && (
                      <Check className="w-5 h-5 ml-auto" style={{ color: accentPrimary }} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>¿Qué canal quieres usar?</h2>
            <p className="mb-6" style={{ color: textMuted }}>Selecciona el canal de comunicación</p>
            <div className="grid grid-cols-3 gap-4">
              {channels.map((ch) => (
                <motion.button
                  key={ch.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateForm("channel", ch.id)}
                  className="p-5 rounded-xl text-center transition-all"
                  style={{
                    backgroundColor: formData.channel === ch.id ? `${accentPrimary}15` : isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                    border: `2px solid ${formData.channel === ch.id ? accentPrimary : borderColor}`
                  }}
                >
                  <ch.icon className="w-8 h-8 mx-auto mb-3" style={{ color: formData.channel === ch.id ? accentPrimary : textMuted }} />
                  <div className="font-semibold" style={{ color: textPrimary }}>{ch.name}</div>
                  <div className="text-xs mt-1" style={{ color: textMuted }}>{ch.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>¿Cuál es tu industria?</h2>
              <p className="mb-4" style={{ color: textMuted }}>Esto nos ayuda a personalizar el contenido</p>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => updateForm("industry", ind.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: formData.industry === ind.id ? accentPrimary : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                      color: formData.industry === ind.id ? "white" : textSecondary
                    }}
                  >
                    <span>{ind.emoji}</span> {ind.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>¿Qué tono prefieres?</h2>
              <p className="mb-4" style={{ color: textMuted }}>Define la personalidad del mensaje</p>
              <div className="grid grid-cols-3 gap-3">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateForm("tone", t.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: formData.tone === t.id ? `${accentPrimary}15` : isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                      border: `2px solid ${formData.tone === t.id ? accentPrimary : borderColor}`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{t.emoji}</span>
                      <span className="font-medium" style={{ color: textPrimary }}>{t.name}</span>
                    </div>
                    <p className="text-xs" style={{ color: textMuted }}>{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                Describe tu audiencia (opcional)
              </label>
              <textarea
                value={formData.audienceDescription}
                onChange={(e) => updateForm("audienceDescription", e.target.value)}
                placeholder="Ej: Usuarios que no han comprado en los últimos 30 días, interesados en tecnología..."
                rows={3}
                className="w-full p-4 rounded-xl text-sm resize-none"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>Define tu contenido</h2>
              <p className="mb-6" style={{ color: textMuted }}>Cuéntanos sobre tu mensaje y la IA hará el resto</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                <Lightbulb className="w-4 h-4 inline mr-1" /> Mensaje clave *
              </label>
              <input
                type="text"
                value={formData.keyMessage}
                onChange={(e) => updateForm("keyMessage", e.target.value)}
                placeholder="Ej: 50% de descuento en tu próxima compra"
                className="w-full p-4 rounded-xl text-sm"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                Describe tu producto/servicio
              </label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => updateForm("productDescription", e.target.value)}
                placeholder="Ej: Plataforma SaaS de gestión de proyectos para equipos remotos..."
                rows={3}
                className="w-full p-4 rounded-xl text-sm resize-none"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                Call to Action (CTA)
              </label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => updateForm("cta", e.target.value)}
                placeholder="Ej: Comprar ahora, Registrarse gratis, Ver ofertas..."
                className="w-full p-4 rounded-xl text-sm"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                Contexto adicional (opcional)
              </label>
              <textarea
                value={formData.additionalContext}
                onChange={(e) => updateForm("additionalContext", e.target.value)}
                placeholder="Cualquier información adicional que quieras incluir..."
                rows={3}
                className="w-full p-4 rounded-xl text-sm resize-none"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            {!generatedContent && !isGenerating && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accentPrimary}20, rgba(6,182,212,0.2))` }}>
                  <Brain className="w-12 h-12" style={{ color: accentPrimary }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>¡Listo para generar!</h2>
                <p className="mb-8 max-w-md mx-auto" style={{ color: textMuted }}>
                  Nadakki AI creará un template optimizado basado en tus preferencias
                </p>
                
                {/* Resumen */}
                <div className="max-w-md mx-auto p-4 rounded-xl mb-8 text-left"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
                  <h4 className="font-semibold mb-3" style={{ color: textPrimary }}>Resumen:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span style={{ color: textMuted }}>Objetivo:</span><span style={{ color: textPrimary }}>{objectives.find(o => o.id === formData.objective)?.name}</span></div>
                    <div className="flex justify-between"><span style={{ color: textMuted }}>Canal:</span><span style={{ color: textPrimary }}>{channels.find(c => c.id === formData.channel)?.name}</span></div>
                    <div className="flex justify-between"><span style={{ color: textMuted }}>Industria:</span><span style={{ color: textPrimary }}>{industries.find(i => i.id === formData.industry)?.name}</span></div>
                    <div className="flex justify-between"><span style={{ color: textMuted }}>Tono:</span><span style={{ color: textPrimary }}>{tones.find(t => t.id === formData.tone)?.name}</span></div>
                  </div>
                </div>

                <button
                  onClick={generateTemplate}
                  className="px-8 py-4 rounded-xl font-semibold text-white flex items-center gap-3 mx-auto"
                  style={{ background: `linear-gradient(135deg, ${accentPrimary}, #06b6d4)` }}
                >
                  <Wand2 className="w-5 h-5" />
                  Generar Template con IA
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accentPrimary}30, rgba(6,182,212,0.3))` }}
                >
                  <Brain className="w-10 h-10" style={{ color: accentPrimary }} />
                </motion.div>
                <h3 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>Generando tu template...</h3>
                <p style={{ color: textMuted }}>Nadakki AI está optimizando el contenido</p>
                <div className="mt-6 space-y-2 text-sm" style={{ color: textMuted }}>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    ✓ Analizando objetivo y audiencia...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                    ✓ Generando copy optimizado...
                  </motion.p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
                    ✓ Aplicando best practices del canal...
                  </motion.p>
                </div>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: textPrimary }}>¡Template generado! ✨</h2>
                    <p style={{ color: textMuted }}>Revisa y personaliza el resultado</p>
                  </div>
                  <button
                    onClick={() => { setGeneratedContent(null); generateTemplate(); }}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerar
                  </button>
                </div>

                {/* Predicciones */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: isLight ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.1)" }}>
                    <div className="text-2xl font-bold text-green-500">{generatedContent.metadata.predictedCTR}%</div>
                    <div className="text-xs" style={{ color: textMuted }}>CTR Predicho</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: `${accentPrimary}10` }}>
                    <div className="text-2xl font-bold" style={{ color: accentPrimary }}>{generatedContent.metadata.predictedConversion}%</div>
                    <div className="text-xs" style={{ color: textMuted }}>Conversión Pred.</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
                    <div className="text-2xl font-bold" style={{ color: textPrimary }}>{generatedContent.metadata.readingTime}</div>
                    <div className="text-xs" style={{ color: textMuted }}>Tiempo lectura</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
                    <div className="text-2xl font-bold" style={{ color: textPrimary }}>{generatedContent.metadata.wordCount}</div>
                    <div className="text-xs" style={{ color: textMuted }}>Palabras</div>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                  <div className="p-3 flex items-center justify-between" style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.03)", borderBottom: `1px solid ${borderColor}` }}>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>Vista previa</span>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded" style={{ backgroundColor: `${accentPrimary}20` }}><Eye className="w-4 h-4" style={{ color: accentPrimary }} /></button>
                      <button className="p-1.5 rounded" style={{ backgroundColor: `${accentPrimary}20` }}><Copy className="w-4 h-4" style={{ color: accentPrimary }} /></button>
                    </div>
                  </div>
                  <div className="p-6" style={{ backgroundColor: bgSecondary }}>
                    <div className="mb-2 text-xs" style={{ color: textMuted }}>Subject: {generatedContent.subject}</div>
                    <div className="mb-4 text-xs" style={{ color: textMuted }}>Preheader: {generatedContent.preheader}</div>
                    <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>{generatedContent.headline}</h3>
                    <div className="whitespace-pre-line mb-6" style={{ color: textSecondary }}>{generatedContent.body}</div>
                    <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: accentPrimary }}>
                      {generatedContent.cta}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                    style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>
                    <Save className="w-5 h-5" /> Guardar como borrador
                  </button>
                  <button className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentPrimary }}>
                    <Send className="w-5 h-5" /> Usar en campaña
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bgPrimary }}>
      <Sidebar />
      <main className="flex-1 ml-80">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="flex items-center gap-1 text-sm hover:opacity-80" style={{ color: textMuted }}><Home className="w-4 h-4" /> Inicio</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <Link href="/marketing/templates" className="text-sm hover:opacity-80" style={{ color: textMuted }}>Templates</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: accentPrimary }}>Crear con IA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/marketing/templates" className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
                <ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                  <Wand2 className="w-6 h-6" style={{ color: accentPrimary }} />
                  AI Template Generator
                </h1>
                <p className="text-sm" style={{ color: textSecondary }}>Crea templates optimizados con inteligencia artificial</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: currentStep >= step.id ? accentPrimary : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                        color: currentStep >= step.id ? "white" : textMuted
                      }}
                    >
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs mt-2 font-medium" style={{ color: currentStep >= step.id ? textPrimary : textMuted }}>{step.name}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-20 h-0.5 mx-2" style={{ backgroundColor: currentStep > step.id ? accentPrimary : borderColor }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 rounded-2xl"
                style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}` }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", color: textSecondary }}
                >
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  disabled={!canProceed()}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: accentPrimary }}
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
