'use client';
import { useState, useEffect } from 'react';
import CoreTabs from './CoreTabs';
import CoreAgentCard from './CoreAgentCard';
interface Agent { id: string; name: string; fileName: string; type: 'IA' | 'Agent'; status: 'active' | 'inactive'; path: string; module: string; backendModule: string; }
export default function CoreAgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCore, setActiveCore] = useState('all');
  useEffect(() => {
    fetch('/data/all-agents-structure.json').then(r => r.json()).then(data => {
      setAgents([...data.agentsActive, ...data.agentsInactive]);
      setLoading(false);
    });
  }, []);
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div><p className="mt-4">Cargando agentes...</p></div></div>;
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8">
          <h1 className="text-4xl font-bold">🤖 AI Agents Core Dashboard</h1>
          <p className="text-gray-300 mt-2">Gestión centralizada de agentes por Core</p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4"><div className="text-2xl font-bold text-green-400">{agents.filter(a => a.status === 'active').length}</div><div className="text-sm text-gray-300">Activos</div></div>
            <div className="bg-white/10 rounded-xl p-4"><div className="text-2xl font-bold text-yellow-400">{agents.filter(a => a.status === 'inactive').length}</div><div className="text-sm text-gray-300">Inactivos</div></div>
            <div className="bg-white/10 rounded-xl p-4"><div className="text-2xl font-bold text-blue-400">{agents.length}</div><div className="text-sm text-gray-300">Total</div></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">Selecciona un Core</h2>
          <div className="space-y-4">
            {agents.slice(0, 10).map(agent => <CoreAgentCard key={agent.id} agent={agent} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
