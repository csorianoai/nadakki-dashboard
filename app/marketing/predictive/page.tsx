"use client";
import { useState } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Brain, TrendingUp, TrendingDown, Users, Target, Zap,
  AlertTriangle, CheckCircle, Clock, RefreshCw, Loader2,
  BarChart3, Activity, DollarSign, ArrowUp, ArrowDown,
  Download, Sparkles
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";

/**
 * Predictive Analytics — empty state.
 *
 * This page requires ML prediction endpoints that don't exist yet:
 * - GET /api/marketing/predictions/segments
 * - GET /api/marketing/predictions/revenue
 * - GET /api/marketing/alerts/churn
 *
 * When those endpoints are built, wire them here.
 */
export default function PredictivePage() {
  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/marketing">
        <StatusBadge status="warning" label="IA Predictiva" size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Metricas Predictivas</h1>
            <p className="text-gray-400">Predicciones de IA para optimizar tus decisiones</p>
          </div>
        </div>
      </motion.div>

      <div className="text-center py-20">
        <Brain className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-white mb-2">Modelos predictivos no configurados</h2>
        <p className="text-gray-400 max-w-lg mx-auto mb-4">
          Las metricas predictivas requieren datos historicos de campanas, conversiones y comportamiento de usuarios.
          Una vez que tengas suficientes datos, los modelos de IA generaran predicciones automaticamente.
        </p>

        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
          <GlassCard className="p-5 text-center">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Proyeccion de Revenue</h3>
            <p className="text-gray-500 text-xs">Prediccion semanal con intervalo de confianza del 95%</p>
          </GlassCard>
          <GlassCard className="p-5 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Segmentos Predictivos</h3>
            <p className="text-gray-500 text-xs">Probabilidad de conversion y riesgo de churn por segmento</p>
          </GlassCard>
          <GlassCard className="p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Alertas de Churn</h3>
            <p className="text-gray-500 text-xs">Deteccion temprana de clientes en riesgo de abandono</p>
          </GlassCard>
        </div>

        <p className="text-gray-600 text-sm mt-12">
          Requisitos: al menos 30 dias de datos de campanas y 100+ contactos activos.
        </p>
      </div>
    </div>
  );
}
