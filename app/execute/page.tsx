'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { CORES_CONFIG } from '@/config/cores';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

export default function ExecutePage() {
  const router = useRouter();
  const [selectedCore, setSelectedCore] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [coresWithCount, setCoresWithCount] = useState<any[]>([]);
  const [inputData, setInputData] = useState('{\n  "test": true\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCoresCount() {
      const coresList = Object.values(CORES_CONFIG);
      const updated = await Promise.all(
        coresList.map(async (core) => {
          try {
            const res = await fetch(`${API_URL}/api/catalog/${core.id}/agents`);
            if (res.ok) {
              const data = await res.json();
              return { ...core, agentCount: data.total || data.agents?.length || core.agentCount };
            }
          } catch (e) {}
          return core;
        })
      );
      setCoresWithCount(updated);
    }
    loadCoresCount();
  }, []);

  async function loadAgents(coreId: string) {
    setSelectedCore(coreId);
    setSelectedAgent('');
    setAgents([]);
    if (!coreId) return;
    try {
      const res = await fetch(`${API_URL}/api/catalog/${coreId}/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function executeAgent() {
    if (!selectedCore || !selectedAgent) {
      setError('Selecciona un core y un agente');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = JSON.parse(inputData);
      const res = await fetch(`${API_URL}/agents/${selectedCore}/${selectedAgent}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: payload })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Error ejecutando agente');
    } finally {
      setLoading(false);
    }
  }

  const displayCores = coresWithCount.length > 0 ? coresWithCount : Object.values(CORES_CONFIG);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-80">
        <Header title="Ejecutar Agente" subtitle="Selecciona un core y agente para ejecutar" />
        <div className="p-8">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Seleccionar Core ({displayCores.length} disponibles)</label>
                <select 
                  value={selectedCore} 
                  onChange={(e) => loadAgents(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-gray-900 border border-white/20 text-white appearance-none cursor-pointer"
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  <option value="" className="bg-gray-900 text-white">-- Selecciona un Core --</option>
                  {displayCores.map((core) => (
                    <option key={core.id} value={core.id} className="bg-gray-900 text-white">
                      {core.displayName} ({core.agentCount} agentes)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Seleccionar Agente {agents.length > 0 && `(${agents.length} disponibles)`}
                </label>
                <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                  disabled={!agents.length} 
                  className="w-full p-3 rounded-xl bg-gray-900 border border-white/20 text-white disabled:opacity-50 appearance-none cursor-pointer"
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  <option value="" className="bg-gray-900 text-white">-- Selecciona un Agente --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-gray-900 text-white">
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Input Data (JSON)</label>
                <textarea 
                  value={inputData} 
                  onChange={(e) => setInputData(e.target.value)} 
                  rows={8} 
                  className="w-full p-3 rounded-xl bg-gray-900 border border-white/20 text-white font-mono text-sm"
                  style={{ backgroundColor: '#1a1a2e' }}
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button 
                onClick={executeAgent} 
                disabled={loading || !selectedAgent} 
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? 'Ejecutando...' : '🚀 Ejecutar Agente'}
              </button>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Resultado</label>
              <div className="h-96 p-4 rounded-xl border border-white/20 overflow-auto" style={{ backgroundColor: '#1a1a2e' }}>
                {result ? (
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                ) : (
                  <div className="text-gray-500 text-center mt-32">El resultado aparecera aqui</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}