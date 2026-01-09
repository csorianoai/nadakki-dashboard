"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Grid, List, Star, Download, Eye, Copy, Heart, Brain,
  Mail, MessageSquare, Bell, Smartphone, Globe, Layers, Target,
  Zap, Users, TrendingUp, Clock, ChevronRight, X, Check, 
  Home, ArrowLeft, Plus, Wand2, MessageCircle, GitBranch, Beaker, Crown, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

// ═══════════════════════════════════════════════════════════════
// TIPOS Y DATOS
// ═══════════════════════════════════════════════════════════════

interface Template {
  id: number;
  name: string;
  category: string;
  useCase: string;
  thumbnail: string;
  rating: number;
  uses: number;
  isNew: boolean;
  isPremium: boolean;
  isAIOptimized: boolean;
  description: string;
  version: string;
  channels: string[];
  industry: string[];
  performance: { ctr: number; conversion: number; avgResponseTime: string; bestChannel: string; };
  aiCapabilities: { personalization: boolean; autoCopyRewrite: boolean; toneVariants: string[]; dynamicFields: string[]; channelOptimization: boolean; predictivePerformance: boolean; };
}

const goals = [
  { id: "convert", name: "Convertir Leads", icon: "🎯" },
  { id: "recover", name: "Recuperar Carritos", icon: "🛒" },
  { id: "reactivate", name: "Activar Dormidos", icon: "💤" },
  { id: "ltv", name: "Aumentar LTV", icon: "📈" },
  { id: "churn", name: "Reducir Churn", icon: "🛡️" },
  { id: "onboard", name: "Onboarding", icon: "👋" },
];

const categories = [
  { id: "all", name: "Todos", icon: Grid, count: 156 },
  { id: "email", name: "Email", icon: Mail, count: 48 },
  { id: "sms", name: "SMS", icon: MessageSquare, count: 24 },
  { id: "push", name: "Push", icon: Bell, count: 32 },
  { id: "in-app", name: "In-App", icon: Smartphone, count: 28 },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, count: 15 },
];

const industries = [
  { id: "all", name: "Todas", icon: "🌐" },
  { id: "fintech", name: "Fintech", icon: "🏦" },
  { id: "ecommerce", name: "E-commerce", icon: "🛍️" },
  { id: "saas", name: "SaaS", icon: "💻" },
  { id: "healthcare", name: "Healthcare", icon: "🏥" },
];

const collections = [
  { id: "top", name: "Top Converters 2026", icon: "🏆", count: 12 },
  { id: "fintech", name: "Best for Fintech", icon: "🏦", count: 8 },
  { id: "urgent", name: "High Urgency", icon: "⚡", count: 6 },
];

const templatesData: Template[] = [
  { id: 1, name: "Welcome Series - Day 1", category: "email", useCase: "welcome", thumbnail: "🎉", rating: 4.9, uses: 12453, isNew: false, isPremium: false, isAIOptimized: true, description: "Email de bienvenida con introducción a la marca", version: "v2.3", channels: ["email", "push", "in-app"], industry: ["saas", "fintech", "ecommerce"], performance: { ctr: 24.5, conversion: 8.2, avgResponseTime: "2.3h", bestChannel: "email" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["formal", "friendly", "urgent"], dynamicFields: ["user_name", "company", "plan"], channelOptimization: true, predictivePerformance: true } },
  { id: 2, name: "Cart Abandonment - Urgency", category: "email", useCase: "abandoned", thumbnail: "🛒", rating: 4.8, uses: 9821, isNew: false, isPremium: false, isAIOptimized: true, description: "Recupera carritos con sensación de urgencia", version: "v3.1", channels: ["email", "sms", "push", "whatsapp"], industry: ["ecommerce"], performance: { ctr: 32.1, conversion: 12.4, avgResponseTime: "45min", bestChannel: "email+sms" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["urgent", "friendly", "fomo"], dynamicFields: ["user_name", "product_name", "cart_value"], channelOptimization: true, predictivePerformance: true } },
  { id: 3, name: "Black Friday Mega Sale", category: "email", useCase: "promotional", thumbnail: "🏷️", rating: 4.7, uses: 8234, isNew: false, isPremium: true, isAIOptimized: true, description: "Template promocional para eventos especiales", version: "v2.0", channels: ["email", "sms", "push"], industry: ["ecommerce", "saas"], performance: { ctr: 28.3, conversion: 9.8, avgResponseTime: "1.2h", bestChannel: "email" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["aggressive", "exciting"], dynamicFields: ["user_name", "discount_percent"], channelOptimization: true, predictivePerformance: true } },
  { id: 4, name: "Win-Back Campaign", category: "email", useCase: "engagement", thumbnail: "💝", rating: 4.5, uses: 5432, isNew: true, isPremium: false, isAIOptimized: true, description: "Recupera usuarios inactivos con oferta personalizada", version: "v1.5", channels: ["email", "push"], industry: ["saas", "ecommerce", "fintech"], performance: { ctr: 18.7, conversion: 5.3, avgResponseTime: "4.1h", bestChannel: "email" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["caring", "nostalgic"], dynamicFields: ["user_name", "last_activity"], channelOptimization: true, predictivePerformance: true } },
  { id: 5, name: "Payment Reminder", category: "sms", useCase: "transactional", thumbnail: "💳", rating: 4.9, uses: 15678, isNew: false, isPremium: true, isAIOptimized: true, description: "Recordatorio de pago para fintech", version: "v4.2", channels: ["sms", "whatsapp", "email"], industry: ["fintech"], performance: { ctr: 45.2, conversion: 28.7, avgResponseTime: "15min", bestChannel: "sms" }, aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["formal", "friendly"], dynamicFields: ["user_name", "amount", "due_date"], channelOptimization: true, predictivePerformance: true } },
  { id: 6, name: "Feature Announcement", category: "in-app", useCase: "notification", thumbnail: "✨", rating: 4.6, uses: 7234, isNew: true, isPremium: false, isAIOptimized: true, description: "Anuncio de nueva funcionalidad", version: "v2.1", channels: ["in-app", "push", "email"], industry: ["saas"], performance: { ctr: 35.8, conversion: 15.2, avgResponseTime: "instant", bestChannel: "in-app" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["exciting", "informative"], dynamicFields: ["user_name", "feature_name"], channelOptimization: true, predictivePerformance: true } },
  { id: 7, name: "Flash Sale Alert", category: "push", useCase: "promotional", thumbnail: "⚡", rating: 4.7, uses: 8901, isNew: false, isPremium: false, isAIOptimized: true, description: "Alerta de venta relámpago", version: "v3.0", channels: ["push", "sms"], industry: ["ecommerce"], performance: { ctr: 12.4, conversion: 4.8, avgResponseTime: "instant", bestChannel: "push" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["urgent", "fomo"], dynamicFields: ["user_name", "discount"], channelOptimization: true, predictivePerformance: true } },
  { id: 8, name: "NPS Survey", category: "email", useCase: "feedback", thumbnail: "📊", rating: 4.4, uses: 4567, isNew: false, isPremium: false, isAIOptimized: false, description: "Encuesta NPS con alta tasa de respuesta", version: "v1.8", channels: ["email", "in-app"], industry: ["saas", "ecommerce"], performance: { ctr: 22.1, conversion: 18.5, avgResponseTime: "6h", bestChannel: "email" }, aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["friendly", "formal"], dynamicFields: ["user_name", "product"], channelOptimization: false, predictivePerformance: false } },
  { id: 9, name: "Loan Approval", category: "whatsapp", useCase: "transactional", thumbnail: "✅", rating: 4.9, uses: 6789, isNew: true, isPremium: true, isAIOptimized: true, description: "Notificación de aprobación de préstamo", version: "v2.0", channels: ["whatsapp", "sms", "email"], industry: ["fintech"], performance: { ctr: 89.2, conversion: 45.3, avgResponseTime: "5min", bestChannel: "whatsapp" }, aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["formal", "celebratory"], dynamicFields: ["user_name", "loan_amount"], channelOptimization: true, predictivePerformance: true } },
  { id: 10, name: "Property Viewing", category: "sms", useCase: "notification", thumbnail: "🏠", rating: 4.6, uses: 3456, isNew: false, isPremium: false, isAIOptimized: true, description: "Recordatorio de visita a propiedad", version: "v1.5", channels: ["sms", "whatsapp", "email"], industry: ["realestate"], performance: { ctr: 67.8, conversion: 35.2, avgResponseTime: "instant", bestChannel: "sms" }, aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["friendly", "professional"], dynamicFields: ["user_name", "property_address"], channelOptimization: true, predictivePerformance: false } },
  { id: 11, name: "Course Certificate", category: "email", useCase: "engagement", thumbnail: "🎓", rating: 4.8, uses: 5678, isNew: false, isPremium: false, isAIOptimized: false, description: "Certificado de finalización de curso", version: "v2.2", channels: ["email"], industry: ["education"], performance: { ctr: 58.3, conversion: 25.1, avgResponseTime: "3h", bestChannel: "email" }, aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["celebratory", "formal"], dynamicFields: ["user_name", "course_name"], channelOptimization: false, predictivePerformance: false } },
  { id: 12, name: "Appointment Confirm", category: "sms", useCase: "transactional", thumbnail: "🏥", rating: 4.9, uses: 8901, isNew: false, isPremium: true, isAIOptimized: true, description: "Confirmación de cita médica", version: "v3.5", channels: ["sms", "whatsapp", "email"], industry: ["healthcare"], performance: { ctr: 92.1, conversion: 78.4, avgResponseTime: "instant", bestChannel: "sms+whatsapp" }, aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["caring", "professional"], dynamicFields: ["patient_name", "doctor_name", "date"], channelOptimization: true, predictivePerformance: true } },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════

function AIRecommendationPanel({ templates, theme }: any) {
  const isLight = theme?.isLight;
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";
  const textPrimary = isLight ? "#0f172a" : "#f1f5f9";
  const textMuted = isLight ? "#64748b" : "#94a3b8";
  const recommendations = templates.filter((t: Template) => t.isAIOptimized && t.performance.conversion > 8).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl mb-6"
      style={{ background: `linear-gradient(135deg, ${accentPrimary}15, rgba(6,182,212,0.1))`, border: `1px solid ${accentPrimary}30` }}>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5" style={{ color: accentPrimary }} />
        <div>
          <h3 className="font-bold text-sm" style={{ color: textPrimary }}>Nadakki AI Recomienda</h3>
          <p className="text-xs" style={{ color: textMuted }}>Basado en tu industria</p>
        </div>
      </div>
      <div className="space-y-2">
        {recommendations?.map((t: Template) => (
          <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5"
            style={{ backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)" }}>
            <span className="text-xl">{t.thumbnail}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium truncate" style={{ color: textPrimary }}>{t.name}</span>
                {t.isAIOptimized && <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-purple-500 to-cyan-500 text-white">AI</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500">↑{t.performance.conversion}%</span>
                <span style={{ color: textMuted }}>{t.performance.ctr}% CTR</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
          </div>
        ))}
      </div>
      <p className="text-xs mt-3 text-center" style={{ color: textMuted }}>
        Convierten <span className="text-green-500 font-bold">32% más</span> en tu industria
      </p>
    </motion.div>
  );
}

function TemplateCard({ template, theme, onPreview, onUse, isFavorite, onToggleFavorite }: any) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      className="rounded-xl overflow-hidden cursor-pointer group" style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}` }}>
      <div className="relative h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentPrimary}15, rgba(6,182,212,0.1))` }}>
        <span className="text-4xl">{template.thumbnail}</span>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {template.isAIOptimized && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-purple-500 to-cyan-500 text-white flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" />AI</span>}
          {template.isNew && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-500 text-white">NEW</span>}
          {template.isPremium && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />PRO</span>}
        </div>
        <div className="absolute top-2 right-2"><span className="px-1.5 py-0.5 text-[9px] font-mono rounded" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)", color: textMuted }}>{template.version}</span></div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(template.id); }} className="absolute bottom-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100" style={{ backgroundColor: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.5)" }}>
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} style={{ color: isFavorite ? "#ef4444" : textMuted }} />
        </button>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onPreview(template); }} className="px-2.5 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Ver</button>
          <button onClick={(e) => { e.stopPropagation(); onUse(template); }} className="px-2.5 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1" style={{ backgroundColor: accentPrimary }}><Wand2 className="w-3 h-3" />Usar</button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: textPrimary }}>{template.name}</h3>
        <p className="text-xs mb-2 line-clamp-1" style={{ color: textMuted }}>{template.description}</p>
        <div className="grid grid-cols-3 gap-1 mb-2 p-1.5 rounded-lg text-center" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
          <div><div className="text-[10px] font-bold text-green-500">{template.performance.ctr}%</div><div className="text-[9px]" style={{ color: textMuted }}>CTR</div></div>
          <div><div className="text-[10px] font-bold" style={{ color: accentPrimary }}>{template.performance.conversion}%</div><div className="text-[9px]" style={{ color: textMuted }}>Conv</div></div>
          <div><div className="text-[10px] font-bold text-cyan-500">{template.performance.avgResponseTime}</div><div className="text-[9px]" style={{ color: textMuted }}>Resp</div></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">{template.channels.slice(0, 3).map((ch: string) => (<span key={ch} className="w-5 h-5 rounded flex items-center justify-center text-[10px]" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)" }}>{ch === "email" ? "📧" : ch === "sms" ? "💬" : ch === "push" ? "🔔" : ch === "whatsapp" ? "💚" : "📱"}</span>))}</div>
          <div className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-[10px] font-medium" style={{ color: textPrimary }}>{template.rating}</span></div>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewModal({ template, onClose, onUse, theme }: any) {
  const isLight = theme?.isLight;
  const [activeChannel, setActiveChannel] = useState(template.channels[0]);
  const [selectedTone, setSelectedTone] = useState(template.aiCapabilities.toneVariants[0]);
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: bgSecondary }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.thumbnail}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" style={{ color: textPrimary }}>{template.name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono rounded" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>{template.version}</span>
                {template.isAIOptimized && <span className="px-2 py-0.5 text-xs font-bold rounded bg-gradient-to-r from-purple-500 to-cyan-500 text-white">AI</span>}
              </div>
              <p className="text-sm" style={{ color: textMuted }}>{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}><X className="w-5 h-5" style={{ color: accentPrimary }} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="flex gap-1 p-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              {template?.channels?.map((ch: string) => (<button key={ch} onClick={() => setActiveChannel(ch)} className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5" style={{ backgroundColor: activeChannel === ch ? accentPrimary : "transparent", color: activeChannel === ch ? "white" : textMuted }}>{ch === "email" ? <Mail className="w-4 h-4" /> : ch === "sms" ? <MessageSquare className="w-4 h-4" /> : ch === "push" ? <Bell className="w-4 h-4" /> : ch === "whatsapp" ? <MessageCircle className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}{ch}</button>))}
            </div>
            <div className="flex-1 p-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentPrimary}05, rgba(6,182,212,0.05))` }}>
              <div className="text-center"><span className="text-6xl mb-4 block">{template.thumbnail}</span><p className="text-sm" style={{ color: textMuted }}>Vista previa: {activeChannel.toUpperCase()}</p><p className="text-xs mt-2 px-3 py-1 rounded-lg" style={{ backgroundColor: `${accentPrimary}10`, color: accentPrimary }}>Tono: {selectedTone}</p></div>
            </div>
          </div>
          <div className="w-72 p-4 overflow-y-auto" style={{ borderLeft: `1px solid ${borderColor}` }}>
            {template.isAIOptimized && (<div className="mb-4 p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${accentPrimary}10, rgba(6,182,212,0.1))` }}><h4 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: textPrimary }}><Brain className="w-4 h-4" style={{ color: accentPrimary }} />AI Capabilities</h4><div className="space-y-1 text-xs">{template.aiCapabilities.personalization && <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Personalización</span></div>}{template.aiCapabilities.autoCopyRewrite && <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Reescritura IA</span></div>}{template.aiCapabilities.channelOptimization && <div className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Optimización multicanal</span></div>}</div></div>)}
            <div className="mb-4"><h4 className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>Tono</h4><div className="flex flex-wrap gap-1">{template?.aiCapabilities?.toneVariants?.map((tone: string) => (<button key={tone} onClick={() => setSelectedTone(tone)} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: selectedTone === tone ? accentPrimary : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", color: selectedTone === tone ? "white" : textMuted }}>{tone}</button>))}</div></div>
            <div className="mb-4"><h4 className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>Campos dinámicos</h4><div className="flex flex-wrap gap-1">{template?.aiCapabilities?.dynamicFields?.map((field: string) => (<span key={field} className="px-2 py-1 rounded text-[10px] font-mono" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", color: textMuted }}>{`{{${field}}}`}</span>))}</div></div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}><h4 className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: textPrimary }}><BarChart3 className="w-4 h-4" style={{ color: accentPrimary }} />Performance</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span style={{ color: textMuted }}>CTR</span><span className="font-bold text-green-500">{template.performance.ctr}%</span></div><div className="flex justify-between"><span style={{ color: textMuted }}>Conversión</span><span className="font-bold" style={{ color: accentPrimary }}>{template.performance.conversion}%</span></div><div className="flex justify-between"><span style={{ color: textMuted }}>Respuesta</span><span className="font-bold text-cyan-500">{template.performance.avgResponseTime}</span></div><div className="flex justify-between"><span style={{ color: textMuted }}>Mejor canal</span><span className="font-bold" style={{ color: textPrimary }}>{template.performance.bestChannel}</span></div></div></div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-4"><div className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span className="font-semibold" style={{ color: textPrimary }}>{template.rating}</span></div><div className="flex items-center gap-1"><Download className="w-4 h-4" style={{ color: textMuted }} /><span className="font-semibold" style={{ color: textPrimary }}>{template.uses.toLocaleString()}</span></div></div>
          <div className="flex items-center gap-2"><button className="px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}><GitBranch className="w-4 h-4" />Clonar</button><button className="px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}><Beaker className="w-4 h-4" />A/B Test</button><button onClick={() => onUse(template)} className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-1" style={{ backgroundColor: accentPrimary }}><Wand2 className="w-4 h-4" />Usar con IA</button></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function TemplatesPage() {
  const { theme } = useTheme();
  const isLight = theme?.isLight;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("ai-recommended");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showAIOnly, setShowAIOnly] = useState(false);

  const bgPrimary = isLight ? "#f8fafc" : theme?.colors?.bgPrimary || "#0F172A";
  const bgSecondary = isLight ? "#ffffff" : theme?.colors?.bgSecondary || "#111827";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textSecondary = isLight ? "#475569" : theme?.colors?.textSecondary || "#94a3b8";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  const filteredTemplates = useMemo(() => {
    let result = [...templatesData];
    if (selectedCategory !== "all") result = result.filter(t => t.category === selectedCategory);
    if (selectedIndustry !== "all") result = result.filter(t => t.industry.includes(selectedIndustry));
    if (showAIOnly) result = result.filter(t => t.isAIOptimized);
    if (selectedGoal) {
      const goalMapping: Record<string, string[]> = { convert: ["promotional", "engagement"], recover: ["abandoned"], reactivate: ["engagement"], ltv: ["loyalty", "promotional"], churn: ["engagement", "feedback"], onboard: ["welcome", "notification"] };
      result = result.filter(t => goalMapping[selectedGoal]?.includes(t.useCase));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (sortBy === "ai-recommended") result.sort((a, b) => (b.isAIOptimized ? 1 : 0) - (a.isAIOptimized ? 1 : 0) || b.performance.conversion - a.performance.conversion);
    if (sortBy === "popular") result.sort((a, b) => b.uses - a.uses);
    if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "conversion") result.sort((a, b) => b.performance.conversion - a.performance.conversion);
    return result;
  }, [selectedCategory, selectedIndustry, selectedGoal, searchQuery, sortBy, showAIOnly]);

  const toggleFavorite = (id: number) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgPrimary }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="flex items-center gap-1 text-sm hover:opacity-80" style={{ color: textMuted }}><Home className="w-4 h-4" />Inicio</Link>
            <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
            <Link href="/marketing" className="text-sm hover:opacity-80" style={{ color: textMuted }}>Marketing</Link>
            <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
            <span className="text-sm font-medium" style={{ color: accentPrimary }}>Templates</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketing" className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}><ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} /></Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: textPrimary }}><Brain className="w-6 h-6" style={{ color: accentPrimary }} />AI Template Engine</h1>
                <p className="text-sm" style={{ color: textSecondary }}>{filteredTemplates.length} templates • Powered by Nadakki AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAIOnly(!showAIOnly)} className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2" style={{ backgroundColor: showAIOnly ? accentPrimary : `${accentPrimary}20`, color: showAIOnly ? "white" : accentPrimary }}><Brain className="w-4 h-4" />Solo AI</button>
              <Link href="/marketing/templates/create" className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-2" style={{ backgroundColor: accentPrimary }}><Wand2 className="w-4 h-4" />Generar con IA</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto flex">
        {/* Sidebar Filtros */}
        <aside className="w-64 p-4 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto flex-shrink-0" style={{ borderRight: `1px solid ${borderColor}` }}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }} />
          </div>

          {/* Objetivos - Lista vertical compacta */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>Objetivo</h3>
            <div className="space-y-0.5">
              {goals?.map((g) => (
                <button key={g.id} onClick={() => setSelectedGoal(selectedGoal === g.id ? null : g.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm" style={{ backgroundColor: selectedGoal === g.id ? `${accentPrimary}20` : "transparent", color: selectedGoal === g.id ? accentPrimary : textSecondary }}>
                  <span>{g.icon}</span><span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Canal */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>Canal</h3>
            <div className="space-y-0.5">
              {categories?.map((c) => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm" style={{ backgroundColor: selectedCategory === c.id ? `${accentPrimary}20` : "transparent", color: selectedCategory === c.id ? accentPrimary : textSecondary }}>
                  <div className="flex items-center gap-2"><c.icon className="w-4 h-4" /><span>{c.name}</span></div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.1)" }}>{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Industria */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>Industria</h3>
            <div className="space-y-0.5">
              {industries?.map((i) => (
                <button key={i.id} onClick={() => setSelectedIndustry(i.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left" style={{ backgroundColor: selectedIndustry === i.id ? `${accentPrimary}20` : "transparent", color: selectedIndustry === i.id ? accentPrimary : textSecondary }}>
                  <span>{i.icon}</span><span>{i.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colecciones */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>Colecciones</h3>
            <div className="space-y-1">
              {collections?.map((col) => (
                <div key={col.id} className="p-2 rounded-lg cursor-pointer hover:bg-white/5" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2"><span>{col.icon}</span><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate" style={{ color: textPrimary }}>{col.name}</div><div className="text-xs" style={{ color: textMuted }}>{col.count} templates</div></div></div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* AI Panel */}
          <AIRecommendationPanel templates={templatesData} theme={theme} />

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("grid")} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === "grid" ? `${accentPrimary}20` : "transparent", color: viewMode === "grid" ? accentPrimary : textMuted }}><Grid className="w-5 h-5" /></button>
              <button onClick={() => setViewMode("list")} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === "list" ? `${accentPrimary}20` : "transparent", color: viewMode === "list" ? accentPrimary : textMuted }}><List className="w-5 h-5" /></button>
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
              <option value="ai-recommended">🧠 AI Recomendados</option>
              <option value="conversion">📈 Mayor conversión</option>
              <option value="popular">🔥 Más populares</option>
              <option value="rating">⭐ Mejor valorados</option>
            </select>
          </div>

          {/* Grid */}
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-4" : "grid-cols-1"}`}>
            {filteredTemplates?.map((t) => (
              <TemplateCard key={t.id} template={t} theme={theme} onPreview={setPreviewTemplate} onUse={() => {}} isFavorite={favorites.includes(t.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: textPrimary }}>No se encontraron templates</h3>
              <p className="mb-4" style={{ color: textMuted }}>Intenta otros filtros o genera uno nuevo</p>
              <Link href="/marketing/templates/create" className="px-4 py-2 rounded-lg font-medium text-white inline-flex items-center gap-2" style={{ backgroundColor: accentPrimary }}><Wand2 className="w-4 h-4" />Generar con IA</Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>{previewTemplate && <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} onUse={() => {}} theme={theme} />}</AnimatePresence>
    </div>
  );
}

