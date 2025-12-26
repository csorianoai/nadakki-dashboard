'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AgentCard from '@/components/ui/AgentCard';
import { CORES_CONFIG } from '@/config/cores';
import { api } from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  category?: string;
}

export default function CorePage() {
  const params = useParams();
  const coreId = params.core as string;
  const coreConfig = CORES_CONFIG[coreId];
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        const data = await api.getAgents(coreId);
        if (data?.agents) {
          setAgents(data.agents);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoading(false);
      }
    }
    if (coreId) loadAgents();
  }, [coreId]);

  if (!coreConfig) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-80 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-400">Core no encontrado</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-80">
        <Header 
          title={coreConfig.displayName}
          subtitle={`${coreConfig.agentCount} agentes - ${coreConfig.description}`}
          coreColor={coreConfig.color}
        />
        <div className="p-8">
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono" style={{color: coreConfig.color}}>
                {coreConfig.agentCount}
              </div>
              <div className="text-sm text-gray-400 mt-2">Agentes</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-green-400">v3.2.0</div>
              <div className="text-sm text-gray-400 mt-2">Version</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-yellow-400">98.5%</div>
              <div className="text-sm text-gray-400 mt-2">Precision</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-cyan-400">ACTIVO</div>
              <div className="text-sm text-gray-400 mt-2">Estado</div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-6" style={{color: coreConfig.color}}>
            Agentes Disponibles
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="glass rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  id={agent.id}
                  name={agent.id}
                  displayName={agent.name}
                  category={agent.category}
                  status="active"
                  coreColor={coreConfig.color}
                  onClick={() => console.log(agent.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-gray-400">Conectando con backend...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}