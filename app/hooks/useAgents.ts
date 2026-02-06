"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export function useAgents() {
  const [data, setData] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        // Simular fetch de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Datos de ejemplo - 239 AGENTES
        const mockAgents: Agent[] = Array.from({ length: 239 }, (_, i) => ({
          id: `agent-${i + 1}`,
          name: `Agente ${i + 1}`,
          status: Math.random() > 0.2 ? "active" : "inactive",
        }));
        
        setData(mockAgents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return { data, isLoading };
}

