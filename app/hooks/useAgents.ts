'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  type: string;
  fileName: string;
  backendModule: string;
}

interface AgentsData {
  agentsActive: Agent[];
  agentsInactive: Agent[];
  totalAgents: number;
}

export function useAgents() {
  const [data, setData] = useState<AgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      const response = await fetch('/data/all-agents-structure.json?t=' + Date.now());
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
    
    // Actualizar cada 30 segundos (sincronización automática)
    const interval = setInterval(loadAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    agents: data ? [...(data.agentsActive || []), ...(data.agentsInactive || [])] : [],
    activeAgents: data?.agentsActive || [],
    inactiveAgents: data?.agentsInactive || [],
    totalAgents: data?.totalAgents || 0,
    activeCount: data?.agentsActive.length || 0,
    inactiveCount: data?.agentsInactive.length || 0,
    loading,
    error,
    refresh: loadAgents
  };
}
