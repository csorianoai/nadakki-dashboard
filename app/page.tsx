'use client';

import { useCores } from '@/hooks/useCores';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CoreCard from '@/components/ui/CoreCard';

export default function HomePage() {
  const { cores, totalAgents, loading } = useCores();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 ml-80">
        <Header 
          title="Global Dashboard" 
          subtitle={`20 AI Cores - ${totalAgents} Agentes - Enterprise Multi-Tenant`}
        />

        <div className="p-8">
          {/* System Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono gradient-text">20</div>
              <div className="text-sm text-gray-400 mt-2">AI Cores</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-cyan-400">
                {loading ? '...' : totalAgents}
              </div>
              <div className="text-sm text-gray-400 mt-2">Agentes Activos</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-green-400">99.7%</div>
              <div className="text-sm text-gray-400 mt-2">Uptime</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold font-mono text-yellow-400">45ms</div>
              <div className="text-sm text-gray-400 mt-2">Latencia</div>
            </div>
          </div>

          {/* Cores Grid */}
          <h2 className="text-xl font-bold mb-6 gradient-text">
            AI Cores Disponibles
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                  <div className="h-14 bg-white/10 rounded-xl mb-4"></div>
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cores.map((core) => (
                <CoreCard
                  key={core.id}
                  id={core.id}
                  name={core.name}
                  displayName={core.displayName}
                  description={core.description}
                  icon={core.icon}
                  color={core.color}
                  gradient={core.gradient}
                  agentCount={core.agentCount}
                  status={core.status}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}