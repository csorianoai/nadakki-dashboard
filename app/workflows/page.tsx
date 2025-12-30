'use client';

// app/workflows/page.tsx - Workflow Catalog & Execution
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTenant } from '@/context/TenantContext';
import { workflowsAPI, Workflow, WorkflowExecutionResponse } from '@/lib/api/workflows';
import { decisionsAPI } from '@/lib/api/decisions';
import { cn } from '@/lib/utils';

const WORKFLOW_ICONS: Record<string, string> = {
  'campaign-optimization': '📊',
  'customer-acquisition-intelligence': '🎯',
  'customer-lifecycle-revenue': '💰',
  'content-performance-engine': '📝',
  'social-media-intelligence': '📱',
  'email-automation-master': '📧',
  'multi-channel-attribution': '🔀',
  'competitive-intelligence-hub': '🔍',
  'ab-testing-experimentation': '🧪',
  'influencer-partnership-engine': '⭐',
};

export default function WorkflowsPage() {
  const { currentTenant } = useTenant();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<WorkflowExecutionResponse | null>(null);
  const [loggedDecision, setLoggedDecision] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    target_market: 'B2B',
    industry_focus: 'fintech',
    leads_count: 500,
    budget: 10000,
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await workflowsAPI.getAll();
      setWorkflows(data.workflows || []);
      if (data.workflows?.length > 0) {
        setSelectedWorkflow(data.workflows[0].id);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedWf = workflows.find(w => w.id === selectedWorkflow);

  

  const executeWorkflow = async () => {
    if (!selectedWorkflow || !currentTenant) return;
    
    setExecuting(true);
    setResult(null);
    setLoggedDecision(null);
    
    try {
      // Execute workflow
      const workflowResult = await workflowsAPI.execute(selectedWorkflow, {
        target_market: formData.target_market,
        industry_focus: [formData.industry_focus],
        leads_count: formData.leads_count,
        budget: formData.budget,
        campaign_brief: {
          name: `Campaign ${Date.now()}`,
          objective: 'lead_generation',
          channel: 'multi_channel',
        },
      });
      
      setResult(workflowResult);
      
      // Log decision to chain
      const logResult = await decisionsAPI.log(currentTenant.tenant_id, workflowResult);
      setLoggedDecision(logResult);
      
    } catch (error) {
      console.error('Error executing workflow:', error);
    } finally {
      setExecuting(false);
    }
  };

  

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-80">
        <Header
          title="🚀 Workflow Execution"
          subtitle={`${workflows.length} workflows disponibles • Nadakki AI Suite`}
        />

        <div className="p-8">
          <div className="grid grid-cols-3 gap-8">
            {/* Workflow Catalog */}
            <div className="col-span-1">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">📚 Catálogo</h2>
                
                {loading ? (
                  <div className="text-center text-gray-400 py-8">Cargando...</div>
                ) : (
                  <div className="space-y-2">
                    {workflows.map((wf) => (
                      <button
                        key={wf.id}
                        onClick={() => setSelectedWorkflow(wf.id)}
                        className={cn(
                          "w-full p-4 rounded-xl text-left transition-all",
                          selectedWorkflow === wf.id
                            ? "bg-cyan-500/20 border border-cyan-500/50"
                            : "bg-glass-bg border border-glass-border hover:border-cyan-500/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{WORKFLOW_ICONS[wf.id] || '⚡'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{wf.name}</div>
                            <div className="text-xs text-gray-500">
                              {wf.agents} agentes • {wf.tier}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Execution Panel */}
            <div className="col-span-2 space-y-6">
              {/* Config Card */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">
                  ⚙️ Configuración: {selectedWf?.name || 'Selecciona un workflow'}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Target Market</label>
                    <select
                      value={formData.target_market}
                      onChange={(e) => setFormData({...formData, target_market: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    >
                      <option value="B2B">B2B</option>
                      <option value="B2C">B2C</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Industry Focus</label>
                    <select
                      value={formData.industry_focus}
                      onChange={(e) => setFormData({...formData, industry_focus: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    >
                      <option value="fintech">Fintech</option>
                      <option value="retail">Retail</option>
                      <option value="banking">Banking</option>
                      <option value="healthcare">Healthcare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Leads Count</label>
                    <input
                      type="number"
                      value={formData.leads_count}
                      onChange={(e) => setFormData({...formData, leads_count: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Budget ($)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={executeWorkflow}
                  disabled={!selectedWorkflow || executing}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-lg transition-all",
                    "bg-gradient-to-r from-cyan-500 to-blue-600",
                    "hover:from-cyan-400 hover:to-blue-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {executing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚡</span>
                      Ejecutando...
                    </span>
                  ) : (
                    '⚡ Ejecutar Workflow'
                  )}
                </button>
              </div>

              {/* Result Card */}
              {result && (
                <div className="glass rounded-2xl p-6 border border-green-500/30">
                  <h2 className="text-lg font-bold mb-4 text-green-400">✅ Resultado</h2>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-glass-bg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-cyan-400">
                        {Math.round((result.decision?.confidence || 0) * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">Confidence</div>
                    </div>
                    <div className="bg-glass-bg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        ${(result.summary?.pipeline_value || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Pipeline</div>
                    </div>
                    <div className="bg-glass-bg rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {result.summary?.total_duration_ms || 0}ms
                      </div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                  </div>

                  <div className="bg-glass-bg rounded-xl p-4 mb-4">
                    <div className="text-sm text-gray-400 mb-2">Decision</div>
                    <div className="text-lg font-medium">{result.decision?.decision}</div>
                  </div>

                  {loggedDecision && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <span>🔗</span>
                        <span className="font-bold">Decision Logged to Chain</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>Decision ID: <span className="font-mono text-cyan-400">{loggedDecision.decision_id}</span></div>
                        <div>Chain Position: <span className="font-mono">#{loggedDecision.chain_position}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


