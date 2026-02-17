'use client';

import { useState, useEffect } from 'react';
import { CORES_CONFIG } from '@/config/cores';

interface CoreData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  agentCount: number;
  status: 'active' | 'inactive' | 'maintenance';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_BASE_URL}';

export function useCores() {
  const [cores, setCores] = useState<CoreData[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCores() {
      const coreIds = Object.keys(CORES_CONFIG);
      const updatedCores: CoreData[] = [];
      let total = 0;

      for (const coreId of coreIds) {
        const config = CORES_CONFIG[coreId];
        let agentCount = config.agentCount;

        try {
          const res = await fetch(`${API_URL}/api/catalog/${coreId}/agents`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            agentCount = data.total || data.agents?.length || config.agentCount;
          }
        } catch (e) {
          // Use fallback from config
        }

        updatedCores.push({ ...config, agentCount });
        total += agentCount;
      }

      updatedCores.sort((a, b) => b.agentCount - a.agentCount);
      setCores(updatedCores);
      setTotalAgents(total);
      setLoading(false);
    }

    fetchCores();
  }, []);

  return { cores, totalAgents, loading };
}
