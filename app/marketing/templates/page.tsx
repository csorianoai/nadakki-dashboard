"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, Grid, List, Star, Download, Eye, Copy, Heart, Brain,
  Mail, MessageSquare, Bell, Smartphone, Globe, Image, Layers, Target,
  Zap, ShoppingCart, Users, Gift, Calendar, TrendingUp, Clock, Sparkles,
  ChevronRight, ChevronDown, X, Check, Layout, Home, ArrowLeft, Plus,
  BarChart3, Wand2, Globe2, MessageCircle, Share2, GitBranch, Beaker,
  Crown, Rocket, Shield, Award, Play, Pause, RefreshCw, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
// Sidebar removido para pantalla completa

// ═══════════════════════════════════════════════════════════════
// TIPOS Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

interface AICapabilities {
  personalization: boolean;
  autoCopyRewrite: boolean;
  toneVariants: string[];
  dynamicFields: string[];
  channelOptimization: boolean;
  predictivePerformance: boolean;
}

interface TemplatePerformance {
  ctr: number;
  conversion: number;
  avgResponseTime: string;
  bestChannel: string;
  industry: string[];
}

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
  tags: string[];
  version: string;
  aiCapabilities: AICapabilities;
  performance: TemplatePerformance;
  channels: string[];
  industry: string[];
}

// Objetivos (Goal-First UX)
const goals = [
  { id: "convert", name: "Convertir Leads", icon: "🎯", color: "from-green-500 to-emerald-500", description: "Transforma prospectos en clientes" },
  { id: "recover", name: "Recuperar Carritos", icon: "🛒", color: "from-orange-500 to-amber-500", description: "Reduce abandono de compra" },
  { id: "reactivate", name: "Activar Dormidos", icon: "💤", color: "from-purple-500 to-violet-500", description: "Re-engancha usuarios inactivos" },
  { id: "ltv", name: "Aumentar LTV", icon: "📈", color: "from-blue-500 to-cyan-500", description: "Incrementa valor de cliente" },
  { id: "churn", name: "Reducir Churn", icon: "🛡️", color: "from-red-500 to-pink-500", description: "Retén a tus clientes" },
  { id: "onboard", name: "Onboarding", icon: "👋", color: "from-teal-500 to-green-500", description: "Guía a nuevos usuarios" },
];

// Categorías
const categories = [
  { id: "all", name: "Todos", icon: Grid, count: 156 },
  { id: "email", name: "Email", icon: Mail, count: 48 },
  { id: "sms", name: "SMS", icon: MessageSquare, count: 24 },
  { id: "push", name: "Push", icon: Bell, count: 32 },
  { id: "in-app", name: "In-App", icon: Smartphone, count: 28 },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, count: 15 },
  { id: "landing", name: "Landing", icon: Globe, count: 18 },
];

// Industrias
const industries = [
  { id: "all", name: "Todas", icon: "🌐" },
  { id: "fintech", name: "Fintech", icon: "🏦" },
  { id: "ecommerce", name: "E-commerce", icon: "🛍️" },
  { id: "saas", name: "SaaS", icon: "💻" },
  { id: "healthcare", name: "Healthcare", icon: "🏥" },
  { id: "realestate", name: "Real Estate", icon: "🏠" },
  { id: "education", name: "Educación", icon: "🎓" },
];

// Colecciones Curadas
const collections = [
  { id: "top-converters", name: "Top Converters 2026", icon: "🏆", count: 12, color: "from-amber-500 to-orange-500" },
  { id: "fintech-best", name: "Best for Fintech", icon: "🏦", count: 8, color: "from-blue-500 to-indigo-500" },
  { id: "high-urgency", name: "High Urgency", icon: "⚡", count: 6, color: "from-red-500 to-pink-500" },
  { id: "enterprise-safe", name: "Enterprise Safe", icon: "🛡️", count: 15, color: "from-slate-500 to-gray-600" },
];

// Templates Data con AI Capabilities
const templatesData: Template[] = [
  {
    id: 1, name: "Welcome Series - Day 1", category: "email", useCase: "welcome",
    thumbnail: "🎉", rating: 4.9, uses: 12453, isNew: false, isPremium: false, isAIOptimized: true,
    description: "Email de bienvenida con introducción a la marca y primer CTA",
    tags: ["bienvenida", "onboarding", "series", "automatizado"],
    version: "v2.3",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["formal", "friendly", "urgent"], dynamicFields: ["user_name", "company", "plan"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 24.5, conversion: 8.2, avgResponseTime: "2.3h", bestChannel: "email", industry: ["saas", "fintech"] },
    channels: ["email", "push", "in-app"],
    industry: ["saas", "fintech", "ecommerce"]
  },
  {
    id: 2, name: "Cart Abandonment - Urgency", category: "email", useCase: "abandoned",
    thumbnail: "🛒", rating: 4.8, uses: 9821, isNew: false, isPremium: false, isAIOptimized: true,
    description: "Recupera carritos abandonados con sensación de urgencia y escasez",
    tags: ["carrito", "abandono", "urgencia", "ecommerce"],
    version: "v3.1",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["urgent", "friendly", "fomo"], dynamicFields: ["user_name", "product_name", "cart_value", "discount"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 32.1, conversion: 12.4, avgResponseTime: "45min", bestChannel: "email+sms", industry: ["ecommerce"] },
    channels: ["email", "sms", "push", "whatsapp"],
    industry: ["ecommerce"]
  },
  {
    id: 3, name: "Black Friday Mega Sale", category: "email", useCase: "promotional",
    thumbnail: "🏷️", rating: 4.7, uses: 8234, isNew: false, isPremium: true, isAIOptimized: true,
    description: "Template promocional para eventos especiales con countdown dinámico",
    tags: ["black friday", "promoción", "descuento", "urgencia"],
    version: "v2.0",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["aggressive", "exciting", "exclusive"], dynamicFields: ["user_name", "discount_percent", "end_date"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 28.3, conversion: 9.8, avgResponseTime: "1.2h", bestChannel: "email", industry: ["ecommerce", "saas"] },
    channels: ["email", "sms", "push"],
    industry: ["ecommerce", "saas"]
  },
  {
    id: 4, name: "Win-Back Campaign", category: "email", useCase: "engagement",
    thumbnail: "💝", rating: 4.5, uses: 5432, isNew: true, isPremium: false, isAIOptimized: true,
    description: "Recupera usuarios inactivos con oferta personalizada basada en historial",
    tags: ["reactivación", "win-back", "usuarios dormidos"],
    version: "v1.5",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["caring", "nostalgic", "exclusive"], dynamicFields: ["user_name", "last_activity", "personalized_offer"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 18.7, conversion: 5.3, avgResponseTime: "4.1h", bestChannel: "email", industry: ["saas", "ecommerce"] },
    channels: ["email", "push"],
    industry: ["saas", "ecommerce", "fintech"]
  },
  {
    id: 5, name: "Payment Reminder - Fintech", category: "sms", useCase: "transactional",
    thumbnail: "💳", rating: 4.9, uses: 15678, isNew: false, isPremium: true, isAIOptimized: true,
    description: "Recordatorio de pago optimizado para fintech con compliance incluido",
    tags: ["pago", "recordatorio", "fintech", "compliance"],
    version: "v4.2",
    aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["formal", "friendly"], dynamicFields: ["user_name", "amount", "due_date", "account"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 45.2, conversion: 28.7, avgResponseTime: "15min", bestChannel: "sms", industry: ["fintech"] },
    channels: ["sms", "whatsapp", "email"],
    industry: ["fintech"]
  },
  {
    id: 6, name: "Feature Announcement", category: "in-app", useCase: "notification",
    thumbnail: "✨", rating: 4.6, uses: 7234, isNew: true, isPremium: false, isAIOptimized: true,
    description: "Anuncio de nueva funcionalidad con tour guiado interactivo",
    tags: ["feature", "anuncio", "producto", "tour"],
    version: "v2.1",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["exciting", "informative", "minimal"], dynamicFields: ["user_name", "feature_name", "benefit"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 35.8, conversion: 15.2, avgResponseTime: "instant", bestChannel: "in-app", industry: ["saas"] },
    channels: ["in-app", "push", "email"],
    industry: ["saas"]
  },
  {
    id: 7, name: "Flash Sale Alert", category: "push", useCase: "promotional",
    thumbnail: "⚡", rating: 4.7, uses: 8901, isNew: false, isPremium: false, isAIOptimized: true,
    description: "Alerta de venta relámpago con countdown y deep linking",
    tags: ["flash sale", "urgencia", "push", "tiempo limitado"],
    version: "v3.0",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["urgent", "fomo", "exclusive"], dynamicFields: ["user_name", "discount", "time_left"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 12.4, conversion: 4.8, avgResponseTime: "instant", bestChannel: "push", industry: ["ecommerce"] },
    channels: ["push", "sms"],
    industry: ["ecommerce"]
  },
  {
    id: 8, name: "NPS Survey", category: "email", useCase: "feedback",
    thumbnail: "📊", rating: 4.4, uses: 4567, isNew: false, isPremium: false, isAIOptimized: false,
    description: "Encuesta NPS con diseño minimalista y alta tasa de respuesta",
    tags: ["nps", "survey", "feedback", "satisfacción"],
    version: "v1.8",
    aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["friendly", "formal"], dynamicFields: ["user_name", "product"], channelOptimization: false, predictivePerformance: false },
    performance: { ctr: 22.1, conversion: 18.5, avgResponseTime: "6h", bestChannel: "email", industry: ["saas", "ecommerce"] },
    channels: ["email", "in-app"],
    industry: ["saas", "ecommerce", "fintech"]
  },
  {
    id: 9, name: "Loan Approval - WhatsApp", category: "whatsapp", useCase: "transactional",
    thumbnail: "✅", rating: 4.9, uses: 6789, isNew: true, isPremium: true, isAIOptimized: true,
    description: "Notificación de aprobación de préstamo vía WhatsApp con documentos",
    tags: ["préstamo", "aprobación", "whatsapp", "fintech"],
    version: "v2.0",
    aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["formal", "celebratory"], dynamicFields: ["user_name", "loan_amount", "rate", "documents"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 89.2, conversion: 45.3, avgResponseTime: "5min", bestChannel: "whatsapp", industry: ["fintech"] },
    channels: ["whatsapp", "sms", "email"],
    industry: ["fintech"]
  },
  {
    id: 10, name: "Property Viewing Reminder", category: "sms", useCase: "notification",
    thumbnail: "🏠", rating: 4.6, uses: 3456, isNew: false, isPremium: false, isAIOptimized: true,
    description: "Recordatorio de visita a propiedad con mapa y detalles",
    tags: ["propiedad", "visita", "recordatorio", "real estate"],
    version: "v1.5",
    aiCapabilities: { personalization: true, autoCopyRewrite: true, toneVariants: ["friendly", "professional"], dynamicFields: ["user_name", "property_address", "agent_name", "time"], channelOptimization: true, predictivePerformance: false },
    performance: { ctr: 67.8, conversion: 35.2, avgResponseTime: "instant", bestChannel: "sms", industry: ["realestate"] },
    channels: ["sms", "whatsapp", "email"],
    industry: ["realestate"]
  },
  {
    id: 11, name: "Course Completion Certificate", category: "email", useCase: "engagement",
    thumbnail: "🎓", rating: 4.8, uses: 5678, isNew: false, isPremium: false, isAIOptimized: false,
    description: "Email de certificado de finalización con badge compartible",
    tags: ["certificado", "curso", "educación", "logro"],
    version: "v2.2",
    aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["celebratory", "formal"], dynamicFields: ["user_name", "course_name", "completion_date", "certificate_url"], channelOptimization: false, predictivePerformance: false },
    performance: { ctr: 58.3, conversion: 25.1, avgResponseTime: "3h", bestChannel: "email", industry: ["education"] },
    channels: ["email"],
    industry: ["education"]
  },
  {
    id: 12, name: "Appointment Confirmation - Healthcare", category: "sms", useCase: "transactional",
    thumbnail: "🏥", rating: 4.9, uses: 8901, isNew: false, isPremium: true, isAIOptimized: true,
    description: "Confirmación de cita médica con preparación y recordatorios",
    tags: ["cita", "médico", "healthcare", "confirmación"],
    version: "v3.5",
    aiCapabilities: { personalization: true, autoCopyRewrite: false, toneVariants: ["caring", "professional"], dynamicFields: ["patient_name", "doctor_name", "date", "preparation_instructions"], channelOptimization: true, predictivePerformance: true },
    performance: { ctr: 92.1, conversion: 78.4, avgResponseTime: "instant", bestChannel: "sms+whatsapp", industry: ["healthcare"] },
    channels: ["sms", "whatsapp", "email"],
    industry: ["healthcare"]
  },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════

// AI Recommendation Panel
function AIRecommendationPanel({ templates, selectedGoal, theme }: any) {
  const isLight = theme?.isLight;
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";
  const bgCard = isLight ? "#ffffff" : "rgba(30,41,59,0.7)";
  const textPrimary = isLight ? "#0f172a" : "#f1f5f9";
  const textMuted = isLight ? "#64748b" : "#94a3b8";

  const recommendations = templates
    .filter((t: Template) => t.isAIOptimized && t.performance.conversion > 8)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-5 rounded-2xl"
      style={{ 
        background: `linear-gradient(135deg, ${accentPrimary}15, rgba(6,182,212,0.1))`,
        border: `1px solid ${accentPrimary}30`
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
          <Brain className="w-5 h-5" style={{ color: accentPrimary }} />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: textPrimary }}>Nadakki AI Recomienda</h3>
          <p className="text-xs" style={{ color: textMuted }}>Basado en tu industria + histórico</p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((template: Template, i: number) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
            style={{ backgroundColor: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{template.thumbnail}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate" style={{ color: textPrimary }}>{template.name}</span>
                  {template.isAIOptimized && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-purple-500 to-cyan-500 text-white">AI</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-green-500 font-medium">↑ {template.performance.conversion}% conv.</span>
                  <span className="text-xs" style={{ color: textMuted }}>{template.performance.ctr}% CTR</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: textMuted }} />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs mt-4 text-center" style={{ color: textMuted }}>
        Estos templates convierten <span className="text-green-500 font-bold">32% más</span> en tu industria
      </p>
    </motion.div>
  );
}

// Goal Selector Component
function GoalSelector({ selectedGoal, onSelectGoal, theme }: any) {
  const isLight = theme?.isLight;
  const textPrimary = isLight ? "#0f172a" : "#f1f5f9";
  const textMuted = isLight ? "#64748b" : "#94a3b8";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: textPrimary }}>
        <Target className="w-4 h-4" /> ¿Qué quieres lograr hoy?
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {goals.map((goal) => (
          <motion.button
            key={goal.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGoal(selectedGoal === goal.id ? null : goal.id)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background: selectedGoal === goal.id 
                ? `linear-gradient(135deg, ${goal.color.replace('from-', '').replace(' to-', ', ').split(',')[0]}20, ${goal.color.split('to-')[1]}20)`
                : isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)",
              border: `2px solid ${selectedGoal === goal.id ? goal.color.includes('green') ? '#22c55e' : goal.color.includes('orange') ? '#f97316' : goal.color.includes('purple') ? '#a855f7' : goal.color.includes('blue') ? '#3b82f6' : goal.color.includes('red') ? '#ef4444' : '#14b8a6' : borderColor}`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{goal.icon}</span>
              <div>
                <div className="text-sm font-medium" style={{ color: textPrimary }}>{goal.name}</div>
                <div className="text-[10px]" style={{ color: textMuted }}>{goal.description}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Template Card con AI Features
function TemplateCard({ template, theme, onPreview, onUse, isFavorite, onToggleFavorite }: any) {
  const isLight = theme?.isLight;
  const bgCard = isLight ? "#ffffff" : theme?.colors?.bgCard || "rgba(30,41,59,0.5)";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : theme?.colors?.borderPrimary || "rgba(255,255,255,0.1)";
  const textPrimary = isLight ? "#0f172a" : theme?.colors?.textPrimary || "#f1f5f9";
  const textMuted = isLight ? "#64748b" : theme?.colors?.textMuted || "#64748b";
  const accentPrimary = theme?.colors?.accentPrimary || "#8b5cf6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{ backgroundColor: bgCard, border: `1px solid ${borderColor}` }}
    >
      {/* Thumbnail */}
      <div className="relative h-36 flex items-center justify-center" 
        style={{ background: `linear-gradient(135deg, ${accentPrimary}15, rgba(6,182,212,0.1))` }}>
        <span className="text-5xl">{template.thumbnail}</span>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {template.isAIOptimized && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white flex items-center gap-1">
              <Brain className="w-3 h-3" /> AI-Optimized
            </span>
          )}
          {template.isNew && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500 text-white">NEW</span>
          )}
          {template.isPremium && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1">
              <Crown className="w-3 h-3" /> PRO
            </span>
          )}
        </div>

        {/* Version Badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-[10px] font-mono rounded" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)", color: textMuted }}>
            {template.version}
          </span>
        </div>

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(template.id); }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.5)" }}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} style={{ color: isFavorite ? "#ef4444" : textMuted }} />
        </button>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onPreview(template); }}
            className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-white/30">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={(e) => { e.stopPropagation(); onUse(template); }}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5"
            style={{ backgroundColor: accentPrimary }}>
            <Wand2 className="w-3.5 h-3.5" /> Usar con IA
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: textPrimary }}>{template.name}</h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: textMuted }}>{template.description}</p>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
          <div className="text-center">
            <div className="text-xs font-bold text-green-500">{template.performance.ctr}%</div>
            <div className="text-[10px]" style={{ color: textMuted }}>CTR</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold" style={{ color: accentPrimary }}>{template.performance.conversion}%</div>
            <div className="text-[10px]" style={{ color: textMuted }}>Conv.</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-cyan-500">{template.performance.avgResponseTime}</div>
            <div className="text-[10px]" style={{ color: textMuted }}>Resp.</div>
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {template.channels.slice(0, 4).map((channel: string) => (
              <span key={channel} className="w-6 h-6 rounded flex items-center justify-center text-xs"
                style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)" }}>
                {channel === "email" ? "📧" : channel === "sms" ? "💬" : channel === "push" ? "🔔" : channel === "whatsapp" ? "💚" : channel === "in-app" ? "📱" : "🌐"}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium" style={{ color: textPrimary }}>{template.rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Preview Modal con Multicanal
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: bgSecondary }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.thumbnail}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{template.name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono rounded" style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>{template.version}</span>
                {template.isAIOptimized && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-gradient-to-r from-purple-500 to-cyan-500 text-white flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: textMuted }}>{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: `${accentPrimary}20` }}>
            <X className="w-5 h-5" style={{ color: accentPrimary }} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left - Preview */}
          <div className="flex-1 flex flex-col">
            {/* Channel Tabs */}
            <div className="flex gap-1 p-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
              {template.channels.map((channel: string) => (
                <button key={channel} onClick={() => setActiveChannel(channel)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: activeChannel === channel ? accentPrimary : "transparent",
                    color: activeChannel === channel ? "white" : textMuted
                  }}>
                  {channel === "email" ? <Mail className="w-4 h-4" /> : channel === "sms" ? <MessageSquare className="w-4 h-4" /> : 
                   channel === "push" ? <Bell className="w-4 h-4" /> : channel === "whatsapp" ? <MessageCircle className="w-4 h-4" /> : 
                   channel === "in-app" ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </button>
              ))}
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-6 flex items-center justify-center overflow-auto"
              style={{ background: `linear-gradient(135deg, ${accentPrimary}05, rgba(6,182,212,0.05))` }}>
              <div className="text-center">
                <span className="text-7xl mb-4 block">{template.thumbnail}</span>
                <p className="text-sm" style={{ color: textMuted }}>Vista previa de {activeChannel.toUpperCase()}</p>
                <p className="text-xs mt-2 px-4 py-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}10`, color: accentPrimary }}>
                  Tono: {selectedTone}
                </p>
              </div>
            </div>
          </div>

          {/* Right - Settings & Info */}
          <div className="w-80 p-4 overflow-y-auto" style={{ borderLeft: `1px solid ${borderColor}` }}>
            {/* AI Capabilities */}
            {template.isAIOptimized && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${accentPrimary}10, rgba(6,182,212,0.1))` }}>
                <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: textPrimary }}>
                  <Brain className="w-4 h-4" style={{ color: accentPrimary }} /> AI Capabilities
                </h4>
                <div className="space-y-2">
                  {template.aiCapabilities.personalization && (
                    <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Personalización automática</span></div>
                  )}
                  {template.aiCapabilities.autoCopyRewrite && (
                    <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Reescritura de copy con IA</span></div>
                  )}
                  {template.aiCapabilities.channelOptimization && (
                    <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Optimización multicanal</span></div>
                  )}
                  {template.aiCapabilities.predictivePerformance && (
                    <div className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-green-500" /><span style={{ color: textMuted }}>Predicción de performance</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Tone Selector */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>Tono del mensaje</h4>
              <div className="flex flex-wrap gap-2">
                {template.aiCapabilities.toneVariants.map((tone: string) => (
                  <button key={tone} onClick={() => setSelectedTone(tone)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: selectedTone === tone ? accentPrimary : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                      color: selectedTone === tone ? "white" : textMuted
                    }}>
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>Campos dinámicos</h4>
              <div className="flex flex-wrap gap-1">
                {template.aiCapabilities.dynamicFields.map((field: string) => (
                  <span key={field} className="px-2 py-1 rounded text-xs font-mono"
                    style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", color: textMuted }}>
                    {`{{${field}}}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: textPrimary }}>
                <BarChart3 className="w-4 h-4" style={{ color: accentPrimary }} /> Performance Real
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: textMuted }}>CTR Promedio</span>
                  <span className="text-sm font-bold text-green-500">{template.performance.ctr}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: textMuted }}>Conversión</span>
                  <span className="text-sm font-bold" style={{ color: accentPrimary }}>{template.performance.conversion}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: textMuted }}>Tiempo respuesta</span>
                  <span className="text-sm font-bold text-cyan-500">{template.performance.avgResponseTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: textMuted }}>Mejor canal</span>
                  <span className="text-sm font-bold" style={{ color: textPrimary }}>{template.performance.bestChannel}</span>
                </div>
              </div>
            </div>

            {/* Industries */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: textPrimary }}>Industrias recomendadas</h4>
              <div className="flex flex-wrap gap-1">
                {template.industry.map((ind: string) => (
                  <span key={ind} className="px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", color: textMuted }}>
                    {industries.find(i => i.id === ind)?.icon} {industries.find(i => i.id === ind)?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold" style={{ color: textPrimary }}>{template.rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" style={{ color: textMuted }} />
              <span className="font-semibold" style={{ color: textPrimary }}>{template.uses.toLocaleString()}</span>
              <span style={{ color: textMuted }}>usos</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>
              <GitBranch className="w-4 h-4" /> Clonar
            </button>
            <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{ backgroundColor: `${accentPrimary}20`, color: accentPrimary }}>
              <Beaker className="w-4 h-4" /> A/B Test
            </button>
            <button onClick={() => onUse(template)}
              className="px-6 py-2 rounded-lg font-medium text-white flex items-center gap-2"
              style={{ backgroundColor: accentPrimary }}>
              <Wand2 className="w-4 h-4" /> Usar con IA
            </button>
          </div>
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

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = [...templatesData];
    
    if (selectedCategory !== "all") result = result.filter(t => t.category === selectedCategory);
    if (selectedIndustry !== "all") result = result.filter(t => t.industry.includes(selectedIndustry));
    if (showAIOnly) result = result.filter(t => t.isAIOptimized);
    if (selectedGoal) {
      const goalMapping: Record<string, string[]> = {
        convert: ["promotional", "engagement"],
        recover: ["abandoned"],
        reactivate: ["engagement"],
        ltv: ["loyalty", "promotional"],
        churn: ["engagement", "feedback"],
        onboard: ["welcome", "notification"]
      };
      result = result.filter(t => goalMapping[selectedGoal]?.includes(t.useCase));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query) || t.tags.some(tag => tag.includes(query)));
    }
    
    // Sort
    if (sortBy === "ai-recommended") result.sort((a, b) => (b.isAIOptimized ? 1 : 0) - (a.isAIOptimized ? 1 : 0) || b.performance.conversion - a.performance.conversion);
    if (sortBy === "popular") result.sort((a, b) => b.uses - a.uses);
    if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "conversion") result.sort((a, b) => b.performance.conversion - a.performance.conversion);
    
    return result;
  }, [selectedCategory, selectedIndustry, selectedGoal, searchQuery, sortBy, showAIOnly]);

  const toggleFavorite = (id: number) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const handleUseTemplate = (template: Template) => console.log("Using template:", template.name);

  return (
    <div className="min-h-screen">
      <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ backgroundColor: `${bgSecondary}ee`, borderBottom: `1px solid ${borderColor}` }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/" className="flex items-center gap-1 text-sm hover:opacity-80" style={{ color: textMuted }}><Home className="w-4 h-4" /> Inicio</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <Link href="/marketing" className="text-sm hover:opacity-80" style={{ color: textMuted }}>Marketing</Link>
              <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
              <span className="text-sm font-medium" style={{ color: accentPrimary }}>Templates</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/marketing" className="p-2 rounded-lg" style={{ backgroundColor: `${accentPrimary}20` }}>
                  <ArrowLeft className="w-5 h-5" style={{ color: accentPrimary }} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                    <Brain className="w-6 h-6" style={{ color: accentPrimary }} />
                    AI Template Engine
                  </h1>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    {filteredTemplates.length} templates inteligentes • Powered by Nadakki AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAIOnly(!showAIOnly)}
                  className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                  style={{ 
                    backgroundColor: showAIOnly ? accentPrimary : `${accentPrimary}20`,
                    color: showAIOnly ? "white" : accentPrimary
                  }}>
                  <Brain className="w-4 h-4" /> Solo AI-Optimized
                </button>
                <Link href="/marketing/templates/create" className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2"
                  style={{ backgroundColor: accentPrimary }}>
                  <Wand2 className="w-4 h-4" /> Generar con IA
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar Filters */}
          <aside className="w-80 p-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto" style={{ borderRight: `1px solid ${borderColor}` }}>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: textMuted }} />
              <input type="text" placeholder="Buscar templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, color: textPrimary }} />
            </div>

            {/* Goal Selector */}
            <GoalSelector selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} theme={theme} />

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>Canal</h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left"
                    style={{ backgroundColor: selectedCategory === cat.id ? `${accentPrimary}20` : "transparent", color: selectedCategory === cat.id ? accentPrimary : textSecondary }}>
                    <div className="flex items-center gap-2"><cat.icon className="w-4 h-4" /><span className="text-sm font-medium">{cat.name}</span></div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.1)" }}>{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>Industria</h3>
              <div className="space-y-1">
                {industries.map((ind) => (
                  <button key={ind.id} onClick={() => setSelectedIndustry(ind.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                    style={{ backgroundColor: selectedIndustry === ind.id ? `${accentPrimary}20` : "transparent", color: selectedIndustry === ind.id ? accentPrimary : textSecondary }}>
                    <span>{ind.icon}</span><span className="text-sm">{ind.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Collections */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>Colecciones Curadas</h3>
              <div className="space-y-2">
                {collections.map((col) => (
                  <div key={col.id} className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${col.color.includes('amber') ? 'rgba(245,158,11,0.1)' : col.color.includes('blue') ? 'rgba(59,130,246,0.1)' : col.color.includes('red') ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)'}, transparent)` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{col.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: textPrimary }}>{col.name}</div>
                        <div className="text-xs" style={{ color: textMuted }}>{col.count} templates</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* AI Recommendation Panel */}
            <div className="mb-6">
              <AIRecommendationPanel templates={templatesData} selectedGoal={selectedGoal} theme={theme} />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode("grid")} className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: viewMode === "grid" ? `${accentPrimary}20` : "transparent", color: viewMode === "grid" ? accentPrimary : textMuted }}>
                  <Grid className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode("list")} className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: viewMode === "list" ? `${accentPrimary}20` : "transparent", color: viewMode === "list" ? accentPrimary : textMuted }}>
                  <List className="w-5 h-5" />
                </button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, color: textPrimary }}>
                <option value="ai-recommended">🧠 AI Recomendados</option>
                <option value="conversion">📈 Mayor conversión</option>
                <option value="popular">🔥 Más populares</option>
                <option value="rating">⭐ Mejor valorados</option>
              </select>
            </div>

            {/* Templates Grid */}
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-3" : "grid-cols-1"}`}>
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} theme={theme} onPreview={setPreviewTemplate}
                  onUse={handleUseTemplate} isFavorite={favorites.includes(template.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: textPrimary }}>No se encontraron templates</h3>
                <p className="mb-4" style={{ color: textMuted }}>Intenta con otros filtros o genera uno nuevo con IA</p>
                <button className="px-4 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: accentPrimary }}>
                  <Wand2 className="w-4 h-4 inline mr-2" /> Generar con IA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewTemplate && (
            <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} onUse={handleUseTemplate} theme={theme} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

