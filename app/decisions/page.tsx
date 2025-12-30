'use client';

// app/decisions/page.tsx - Decision History with Hash Chain
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTenant } from '@/context/TenantContext';
import { decisionsAPI, Decision, ChainVerification } from '@/lib/api/decisions';
import { cn } from '@/lib/utils';

export default function DecisionsPage() {
  const { currentTenant } = useTenant();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [chainStatus, setChainStatus] = useState<ChainVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadDecisions();
      verifyChain();
    }
  }, [currentTenant]);

  const loadDecisions = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const data = await decisionsAPI.getAll(currentTenant.tenant_id);
      setDecisions(data.decisions || []);
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    if (!currentTenant) return;
    setVerifying(true);
    try {
      const result = await decisionsAPI.verifyChain(currentTenant.tenant_id);
      setChainStatus(result);
    } catch (error) {
      console.error('Error verifying chain:', error);
    } finally {
      setVerifying(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action?.includes('ACTIVATE')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (action?.includes('ENRICH')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (action?.includes('REVIEW')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (action?.includes('REJECT')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getAuthorityColor = (mode: string) => {
    if (mode === 'AI_AUTONOMOUS') return 'text-green-400';
    if (mode === 'AI_ASSISTED') return 'text-cyan-400';
    return 'text-yellow-400';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-80">
        <Header
          title="📋 Decision History"
          subtitle={`Hash Chain Inmutable • ${currentTenant?.name || 'Loading...'}`}
        />

        <div className="p-8">
          {/* Chain Status Banner */}
          <div className={cn(
            "rounded-2xl p-6 mb-8 border",
            chainStatus?.valid 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-red-500/10 border-red-500/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  chainStatus?.valid ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                  {chainStatus?.valid ? '🔗' : '⚠️'}
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-lg",
                    chainStatus?.valid ? "text-green-400" : "text-red-400"
                  )}>
                    {chainStatus?.valid ? 'Hash Chain Válido' : 'Chain Requiere Verificación'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {chainStatus?.chain_length || 0} decisiones en cadena
                    {chainStatus?.last_hash && (
                      <span className="ml-2 font-mono text-xs">
                        Last: {chainStatus.last_hash.substring(0, 16)}...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={verifyChain}
                disabled={verifying}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  "bg-glass-bg border border-glass-border",
                  "hover:border-cyan-500/50 hover:text-cyan-400",
                  verifying && "opacity-50 cursor-not-allowed"
                )}
              >
                {verifying ? '⏳ Verificando...' : '🔍 Verificar Chain'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono gradient-text">
                {decisions.length}
              </div>
              <div className="text-sm text-gray-400 mt-2">Total Decisiones</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-green-400">
                {chainStatus?.chain_length || 0}
              </div>
              <div className="text-sm text-gray-400 mt-2">Chain Length</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {decisions.length > 0 
                  ? Math.round(decisions.reduce((sum, d) => sum + (d.decision?.confidence || 0), 0) / decisions.length * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Avg Confidence</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-yellow-400">
                ${decisions.reduce((sum, d) => sum + (d.business_impact?.pipeline_value || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 mt-2">Total Pipeline</div>
            </div>
          </div>

          {/* Decisions Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-glass-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Historial de Decisiones</h2>
              <button
                onClick={loadDecisions}
                className="px-4 py-2 rounded-lg bg-glass-bg border border-glass-border hover:border-cyan-500/50 transition-colors"
              >
                🔄 Refrescar
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="animate-spin text-4xl mb-4">⚡</div>
                Cargando decisiones...
              </div>
            ) : decisions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-4">📭</div>
                No hay decisiones registradas para este tenant
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-glass-bg/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Decision ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Workflow</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Acción</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Confidence</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Pipeline</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Authority</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Chain #</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {decisions.map((decision) => (
                      <tr key={decision.decision_id} className="hover:bg-glass-bg/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-cyan-400">
                            {decision.decision_id?.substring(0, 12)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {decision.workflow_name || decision.workflow_id}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border",
                            getActionBadgeColor(decision.decision?.action)
                          )}>
                            {decision.decision?.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-glass-bg rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full"
                                style={{ width: `${(decision.decision?.confidence || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono">
                              {Math.round((decision.decision?.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-green-400 font-mono">
                          ${(decision.business_impact?.pipeline_value || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-sm font-medium", getAuthorityColor(decision.authority?.decision_mode))}>
                            {decision.authority?.decision_mode?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          #{decision.audit?.chain_position}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-500">
                            {decision.audit?.output_hash?.substring(0, 8)}...
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
