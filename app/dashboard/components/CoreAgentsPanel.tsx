'use client';

import { useState, useEffect, useMemo } from 'react';
import CoreTabs from './CoreTabs';
import CoreAgentCard from './CoreAgentCard';

interface Agent {
  id: string;
  name: string;
  fileName: string;
  type: 'IA' | 'Agent';
  status: 'active' | 'inactive';
  inactiveReason?: string;
  path: string;
  module: string;
  backendModule: string;
}

interface CoreData {
  id: string;
  name: string;
  displayName: string;
  activeCount: number;
  inactiveCount: number;
  totalCount: number;
  color: string;
  description: string;
}

export default function CoreAgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cores, setCores] = useState<CoreData[]>([]);
  const [activeCore, setActiveCore] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/all-agents-structure.json', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.agentsActive || !data.agentsInactive) {
          throw new Error('Estructura JSON inválida');
        }
        
        const allAgents: Agent[] = [...data.agentsActive, ...data.agentsInactive];
        setAgents(allAgents);
        
        const coreMap = new Map<string, CoreData>();
        
        allAgents.forEach(agent => {
          const coreId = agent.backendModule || 'unclassified';
          if (!coreMap.has(coreId)) {
            coreMap.set(coreId, {
              id: coreId,
              name: coreId,
              displayName: formatCoreName(coreId),
              activeCount: 0,
              inactiveCount: 0,
              totalCount: 0,
              color: getCoreColor(coreId),
              description: getCoreDescription(coreId)
            });
          }
          
          const core = coreMap.get(coreId)!;
          if (agent.status === 'active') {
            core.activeCount++;
          } else {
            core.inactiveCount++;
          }
          core.totalCount++;
        });
        
        const coresArray = Array.from(coreMap.values())
          .filter(core => core.totalCount > 0)
          .sort((a, b) => b.totalCount - a.totalCount);
        
        setCores(coresArray);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar datos';
        setError(errorMessage);
        console.error('Error loading agents data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatCoreName = (coreId: string): string => {
    return coreId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCoreColor = (coreId: string): string => {
    const colorMap: Record<string, string> = {
      'marketing': 'blue',
      'contabilidad': 'green',
      'logistica': 'red',
      'ventascrm': 'purple',
      'educacion': 'yellow',
      'rrhh': 'pink',
      'presupuesto': 'indigo',
      'investigacion': 'teal',
      'unclassified': 'gray',
    };
    return colorMap[coreId] || 'gray';
  };

  const getCoreDescription = (coreId: string): string => {
    const descriptionMap: Record<string, string> = {
      'marketing': 'Agentes de marketing digital y publicidad',
      'contabilidad': 'Agentes de finanzas y contabilidad',
      'logistica': 'Agentes de logística y cadena de suministro',
      'ventascrm': 'Agentes de ventas y CRM',
      'educacion': 'Agentes educativos y de formación',
      'rrhh': 'Agentes de recursos humanos',
      'presupuesto': 'Agentes de presupuesto y forecasting',
      'investigacion': 'Agentes de investigación y desarrollo',
      'unclassified': 'Agentes sin clasificación específica',
    };
    return descriptionMap[coreId] || 'Agentes de propósito general';
  };

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesCore = activeCore === 'all' || agent.backendModule === activeCore;
      const matchesStatus = filterActive === 'all' || agent.status === filterActive;
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.backendModule.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCore && matchesStatus && matchesSearch;
    });
  }, [agents, activeCore, filterActive, searchTerm]);

  const activeCoreData = cores.find(core => core.id === activeCore);
  const totalStats = {
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
    total: agents.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-6 text-gray-600 text-lg">Cargando {totalStats.total} agentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">🤖 AI Agents Core Dashboard</h1>
              <p className="text-gray-300 mt-2">
                Gestión centralizada de agentes organizados por área funcional (Core)
              </p>
            </div>
            <div className="lg:text-right">
              <div className="text-4xl md:text-5xl font-bold">{totalStats.total}</div>
              <div className="text-sm text-gray-300">Agentes totales</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{totalStats.active}</div>
              <div className="text-sm text-gray-300">Agentes activos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">{totalStats.inactive}</div>
              <div className="text-sm text-gray-300">Agentes inactivos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{cores.length}</div>
              <div className="text-sm text-gray-300">Cores identificados</div>
            </div>
          </div>
        </div>

        {/* Core Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 Selecciona un Core</h2>
          <CoreTabs 
            cores={cores}
            activeCore={activeCore}
            onCoreChange={setActiveCore}
          />
          
          {activeCoreData && activeCore !== 'all' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{activeCoreData.displayName}</h3>
              </div>
              <p className="text-gray-600 mb-3">{activeCoreData.description}</p>
              <div className="flex gap-4 flex-wrap text-sm">
                <span className="text-green-600 font-semibold">✅ {activeCoreData.activeCount} activos</span>
                <span className="text-yellow-600 font-semibold">⏸️ {activeCoreData.inactiveCount} inactivos</span>
                <span className="text-gray-600 font-semibold">📊 {activeCoreData.totalCount} total</span>
              </div>
            </div>
          )}
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar agentes por nombre, archivo o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Buscar agentes"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterActive === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterActive === 'all'}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterActive === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterActive === 'active'}
              >
                ✅ Activos
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterActive === 'inactive'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterActive === 'inactive'}
              >
                ⏸️ Inactivos
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            Mostrando <span className="font-bold text-gray-900">{filteredAgents.length}</span> de{' '}
            <span className="font-bold text-gray-900">{agents.length}</span> agentes
            {activeCore !== 'all' && ` en el core "${activeCoreData?.displayName}"`}
            {searchTerm && ` que coinciden con "${searchTerm}"`}
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {activeCore === 'all' ? 'Todos los Agentes' : `Agentes del Core ${activeCoreData?.displayName}`}
            </h2>
            <div className="text-sm text-gray-500">
              {filteredAgents.length} {filteredAgents.length === 1 ? 'agente' : 'agentes'}
            </div>
          </div>
          
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron agentes</h3>
              <p className="text-gray-500">Intenta con otros filtros o términos de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAgents.map(agent => (
                <CoreAgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Distribución por Core */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Distribución por Core</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cores.map(core => (
              <div 
                key={core.id}
                className={`p-4 rounded-xl border-l-4 cursor-pointer transition hover:shadow-md ${
                  activeCore === core.id ? 'bg-blue-50 border-l-blue-600' : 'bg-white border-l-gray-300'
                }`}
                onClick={() => setActiveCore(core.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-bold text-gray-900">{core.displayName}</div>
                    <div className="text-sm text-gray-500">{core.totalCount} agentes</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-green-600 font-semibold">✅ {core.activeCount}</span>
                  <span className="text-yellow-600 font-semibold">⏸️ {core.inactiveCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
