"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Play, RotateCcw, CheckCircle2, XCircle, Clock, 
  Loader2, ChevronDown, ChevronUp, Settings, History,
  Zap, Sparkles, BarChart3, TrendingUp, ArrowRight
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface WorkflowStep {
  step: number;
  agent_id: string;
  status: "pending" | "running" | "success" | "error";
  duration_ms?: number;
  error?: string;
}

interface WorkflowResult {
  workflow_id: string;
  execution_id: string;
  status: "success" | "error" | "partial";
  total_duration_ms: number;
  steps: WorkflowStep[];
  final_output?: any;
  error?: string;
}

interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: string;
  agents: number;
  estimatedTime: string;
  inputs: {
    id: string;
    label: string;
    type: "text" | "number" | "select" | "textarea";
    placeholder?: string;
    defaultValue?: any;
    options?: { value: string; label: string }[];
    required?: boolean;
  }[];
}

interface Props {
  config: WorkflowConfig;
}

export default function WorkflowExecutor({ config }: Props) {
  const { tenantId, settings } = useTenant();
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [executionHistory, setExecutionHistory] = useState<WorkflowResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const defaults: Record<string, any> = {};
    config.inputs.forEach(input => {
      defaults[input.id] = input.defaultValue || "";
    });
    setInputs(defaults);
  }, [config.inputs]);

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setResult(null);
    setError(null);
    setCurrentStep(0);

    try {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, config.agents));
      }, 800);

      const response = await fetch(`https://nadakki-ai-suite.onrender.com/workflows/${config.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId
        },
        body: JSON.stringify({
          campaign_brief: {
            name: inputs.campaign_name || "Test Campaign",
            objective: inputs.objective || "lead_generation",
            channel: inputs.channel || "email"
          },
          budget: inputs.budget || 10000,
          target_audience: inputs.target_audience || "",
          tenant_id: tenantId
        })
      });

      clearInterval(stepInterval);
      const data = await response.json();

      const workflowResult: WorkflowResult = {
        workflow_id: config.id,
        execution_id: data.execution_id || `exec_${Date.now()}`,
        status: data.error ? "error" : "success",
        total_duration_ms: data.total_duration_ms || 0,
        steps: data.steps || [],
        final_output: data,
        error: data.error
      };

      setResult(workflowResult);
      setExecutionHistory(prev => [workflowResult, ...prev].slice(0, 5));
      setCurrentStep(config.agents);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setIsExecuting(false);
    }
  };

  const resetWorkflow = () => {
    setResult(null);
    setError(null);
    setCurrentStep(0);
  };

  const updateInput = (id: string, value: any) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl text-4xl" style={{ backgroundColor: `${config.color}20` }}>
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{config.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                  {config.tier}
                </span>
              </div>
              <p className="text-gray-400">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">Agentes</p>
              <p className="text-2xl font-bold text-white">{config.agents}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Tiempo Est.</p>
              <p className="text-2xl font-bold text-white">{config.estimatedTime}</p>
            </div>
          </div>
        </div>

        {isExecuting && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Ejecutando paso {currentStep} de {config.agents}</span>
              <span className="text-sm text-purple-400">{Math.round((currentStep / config.agents) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: config.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / config.agents) * 100}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Config Panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button onClick={() => setShowConfig(!showConfig)} className="w-full flex items-center justify-between p-4 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-white">Configuración</span>
              </div>
              {showConfig ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            <AnimatePresence>
              {showConfig && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-white/10">
                  <div className="p-4 space-y-4">
                    {config.inputs.map(input => (
                      <div key={input.id}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {input.label} {input.required && <span className="text-red-400">*</span>}
                        </label>
                        {input.type === "select" ? (
                          <select
                            value={inputs[input.id] || ""}
                            onChange={(e) => updateInput(input.id, e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white"
                          >
                            <option value="">Seleccionar...</option>
                            {input.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : input.type === "textarea" ? (
                          <textarea
                            value={inputs[input.id] || ""}
                            onChange={(e) => updateInput(input.id, e.target.value)}
                            placeholder={input.placeholder}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 resize-none"
                          />
                        ) : (
                          <input
                            type={input.type}
                            value={inputs[input.id] || ""}
                            onChange={(e) => updateInput(input.id, input.type === "number" ? Number(e.target.value) : e.target.value)}
                            placeholder={input.placeholder}
                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Execute Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg text-white disabled:opacity-50"
              style={{ backgroundColor: isExecuting ? "#475569" : config.color }}
            >
              {isExecuting ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Ejecutando...</>
              ) : (
                <><Play className="w-6 h-6" /> Ejecutar Workflow</>
              )}
            </button>
            {result && (
              <button onClick={resetWorkflow} className="p-4 rounded-xl bg-white/10 hover:bg-white/20">
                <RotateCcw className="w-6 h-6 text-gray-400" />
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-6 ${result.status === "success" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {result.status === "success" ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
                  <div>
                    <h3 className="text-xl font-bold text-white">{result.status === "success" ? "Completado" : "Error"}</h3>
                    <p className="text-sm text-gray-400">ID: {result.execution_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{(result.total_duration_ms / 1000).toFixed(2)}s</p>
                  <p className="text-sm text-gray-400">Tiempo total</p>
                </div>
              </div>

              {result.steps?.length > 0 && (
                <div className="mb-6 space-y-2">
                  {result.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-black/20">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === "success" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                        {step.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <p className="text-white flex-1">Step {i + 1}: {step.agent_id || "Processing"}</p>
                      {step.duration_ms && <span className="text-gray-400 text-sm">{step.duration_ms}ms</span>}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setShowRawOutput(!showRawOutput)} className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
                {showRawOutput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showRawOutput ? "Ocultar" : "Ver"} Output
              </button>
              {showRawOutput && (
                <pre className="mt-4 p-4 rounded-xl bg-black/30 text-sm text-gray-300 overflow-auto max-h-96">
                  {JSON.stringify(result.final_output, null, 2)}
                </pre>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Tenant</span><span className="text-white">{settings.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="text-purple-400">{settings.plan.toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Agentes</span><span className="text-white">{config.agents}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-black/20">
                <p className="text-xl font-bold text-green-400">94%</p>
                <p className="text-xs text-gray-400">Éxito</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-black/20">
                <p className="text-xl font-bold text-blue-400">2.3s</p>
                <p className="text-xs text-gray-400">Promedio</p>
              </div>
            </div>
          </div>

          {executionHistory.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-yellow-400" /> Historial
              </h3>
              <div className="space-y-2">
                {executionHistory.map((exec, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                    {exec.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className="text-xs text-gray-400 truncate flex-1">{exec.execution_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/workflows" className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-white">Ver todos los workflows</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}